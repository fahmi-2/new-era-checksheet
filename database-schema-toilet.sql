-- SQL Schema untuk Toilet Inspections
-- Jalankan query ini di database untuk membuat table

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
    
    -- Index untuk query performa
    INDEX idx_area_date (area_code, inspection_date),
    INDEX idx_inspection_date (inspection_date),
    UNIQUE KEY unique_inspection (area_code, inspection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detail struktur dari kolom details (JSON):
-- {
--   "kebersihan_lantai": "OK|NG|null",
--   "kebersihan_dinding": "OK|NG|null",
--   "kebersihan_cermin": "OK|NG|null",
--   "kebersihan_wastafel": "OK|NG|null",
--   "kebersihan_toilet": "OK|NG|null",
--   "kebersihan_tempat_sampah": "OK|NG|null",
--   "ketersediaan_toilet_paper": "OK|NG|null",
--   "ketersediaan_sabun": "OK|NG|null",
--   "ketersediaan_air": "OK|NG|null",
--   "ventilasi_udara": "OK|NG|null",
--   "pencahayaan": "OK|NG|null",
--   "deodorizer": "OK|NG|null",
--   "notes": "string",
--   "submittedAt": "ISO datetime string"
-- }
