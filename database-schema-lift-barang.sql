-- SQL Schema untuk Lift Barang Inspeksi
-- 3 Bulanan (Preventif)

-- Tabel utama untuk inspeksi lift barang
CREATE TABLE IF NOT EXISTS lift_barang_inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_date DATE NOT NULL,
    inspection_type VARCHAR(50) DEFAULT 'preventif' COMMENT '3 bulanan, korektif, dll',
    inspector_name VARCHAR(255) NOT NULL,
    inspector_nik VARCHAR(20),
    inspector_id INT,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index untuk fast lookup
    INDEX idx_inspection_date (inspection_date),
    INDEX idx_inspector (inspector_name),
    UNIQUE KEY unique_inspection_date (inspection_date, inspection_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel detail item inspeksi lift barang
CREATE TABLE IF NOT EXISTS lift_barang_inspection_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    item_number VARCHAR(10) NOT NULL COMMENT '1, 2, 3, ..., 16 (16 item utama)',
    item_name VARCHAR(255) NOT NULL COMMENT 'Nama item seperti PONDASI, KOLOM, etc',
    
    sub_item_id VARCHAR(10) NOT NULL COMMENT '1A, 1B, 1C, 2A, 2B, etc',
    sub_item_name VARCHAR(255) NOT NULL COMMENT 'Nama sub-item seperti KOROSI, KERETAKAN, etc',
    check_method VARCHAR(20) NOT NULL COMMENT 'VISUAL atau DICOBA',
    
    status VARCHAR(10) NOT NULL COMMENT 'OK atau NG',
    notes TEXT COMMENT 'Catatan jika ada NG',
    
    FOREIGN KEY (inspection_id) REFERENCES lift_barang_inspections(id) ON DELETE CASCADE,
    INDEX idx_inspection_item (inspection_id, item_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel untuk foto hasil inspeksi (optional, untuk future enhancement)
CREATE TABLE IF NOT EXISTS lift_barang_inspection_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    item_id INT NOT NULL,
    photo_url VARCHAR(500),
    photo_caption TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inspection_id) REFERENCES lift_barang_inspections(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES lift_barang_inspection_items(id) ON DELETE CASCADE,
    INDEX idx_inspection_photos (inspection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel untuk hasil ringkasan inspeksi
CREATE TABLE IF NOT EXISTS lift_barang_inspection_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    total_items INT DEFAULT 0 COMMENT 'Total sub-items yang diperiksa',
    ok_count INT DEFAULT 0 COMMENT 'Jumlah item dengan status OK',
    ng_count INT DEFAULT 0 COMMENT 'Jumlah item dengan status NG',
    overall_status VARCHAR(10) COMMENT 'OK jika semua OK, NG jika ada NG',
    
    FOREIGN KEY (inspection_id) REFERENCES lift_barang_inspections(id) ON DELETE CASCADE,
    UNIQUE KEY unique_summary (inspection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data struktur inspeksi lift barang (untuk referensi)
-- Item 1: PONDASI / BAUT PENGIKAT
--   1A: KOROSI (VISUAL) → OK/NG
--   1B: KERETAKAN (VISUAL) → OK/NG
--   1C: PERUBAHAN BENTUK (VISUAL) → OK/NG
-- Item 2: KOLOM / RANGKA
--   2A: KOROSI (VISUAL) → OK/NG
--   2B: KERETAKAN (VISUAL) → OK/NG
--   ... dst

-- Query examples:

-- 1. Lihat inspeksi hari ini
-- SELECT * FROM lift_barang_inspections WHERE inspection_date = CURDATE();

-- 2. Lihat detail item untuk satu inspeksi
-- SELECT * FROM lift_barang_inspection_items WHERE inspection_id = ? ORDER BY item_number, sub_item_id;

-- 3. Lihat ringkasan status
-- SELECT * FROM lift_barang_inspection_summary WHERE inspection_id = ?;

-- 4. Hitung NG items per inspeksi
-- SELECT inspection_id, COUNT(*) as ng_count 
-- FROM lift_barang_inspection_items 
-- WHERE status = 'NG' 
-- GROUP BY inspection_id;
