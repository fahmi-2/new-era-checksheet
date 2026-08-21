-- SQL Schema untuk Exit Lamp, Pintu Darurat, dan Titik Kumpul Checklists
-- Jalankan query ini di database untuk membuat tables

-- ==================== EXIT LAMP CHECKLISTS ====================

CREATE TABLE IF NOT EXISTS exit_lamp_checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_date DATE NOT NULL,
    checker_name VARCHAR(255) NOT NULL,
    checker_nik VARCHAR(50),
    checker_dept VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_date (checklist_date),
    UNIQUE KEY unique_checklist (checklist_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exit_lamp_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    kondisi_lampu VARCHAR(10) COMMENT 'OK or NG',
    indikator_lampu VARCHAR(10) COMMENT 'OK or NG',
    kebersihan VARCHAR(10) COMMENT 'OK or NG',
    keterangan TEXT,
    tindakan_perbaikan TEXT,
    pic VARCHAR(255),
    foto_path VARCHAR(500),
    foto_data LONGTEXT COMMENT 'Base64 encoded image',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_exit_lamp_checklist FOREIGN KEY (checklist_id) 
        REFERENCES exit_lamp_checklists(id) ON DELETE CASCADE,
    
    INDEX idx_checklist_id (checklist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PINTU DARURAT CHECKLISTS ====================

CREATE TABLE IF NOT EXISTS pintu_darurat_checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_date DATE NOT NULL,
    checker_name VARCHAR(255) NOT NULL,
    checker_nik VARCHAR(50),
    checker_dept VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_date (checklist_date),
    UNIQUE KEY unique_checklist (checklist_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pintu_darurat_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    kondisi_pintu VARCHAR(10) COMMENT 'OK or NG',
    area_sekitar VARCHAR(10) COMMENT 'OK or NG',
    palu_alat_bantu VARCHAR(10) COMMENT 'OK or NG',
    identitas_pintu VARCHAR(10) COMMENT 'OK or NG',
    id_peringatan VARCHAR(10) COMMENT 'OK or NG',
    door_closer VARCHAR(10) COMMENT 'OK or NG',
    keterangan TEXT,
    tindakan_perbaikan TEXT,
    pic VARCHAR(255),
    foto_path VARCHAR(500),
    foto_data LONGTEXT COMMENT 'Base64 encoded image',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_pintu_darurat_checklist FOREIGN KEY (checklist_id) 
        REFERENCES pintu_darurat_checklists(id) ON DELETE CASCADE,
    
    INDEX idx_checklist_id (checklist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TITIK KUMPUL CHECKLISTS ====================

CREATE TABLE IF NOT EXISTS titik_kumpul_checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_date DATE NOT NULL,
    checker_name VARCHAR(255) NOT NULL,
    checker_nik VARCHAR(50),
    checker_dept VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_date (checklist_date),
    UNIQUE KEY unique_checklist (checklist_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS titik_kumpul_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    area_aman VARCHAR(10) COMMENT 'OK or NG',
    identitas_titik_kumpul VARCHAR(10) COMMENT 'OK or NG',
    area_mobil_pmk VARCHAR(10) COMMENT 'OK or NG',
    keterangan TEXT,
    tindakan_perbaikan TEXT,
    pic VARCHAR(255),
    foto_path VARCHAR(500),
    foto_data LONGTEXT COMMENT 'Base64 encoded image',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_titik_kumpul_checklist FOREIGN KEY (checklist_id) 
        REFERENCES titik_kumpul_checklists(id) ON DELETE CASCADE,
    
    INDEX idx_checklist_id (checklist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jalur_evakuasi_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    question_text TEXT NOT NULL,
    order_number INT,
    hasil_cek VARCHAR(10) COMMENT 'OK or NG',
    keterangan TEXT,
    tindakan_perbaikan TEXT,
    pic VARCHAR(255),
    foto_path VARCHAR(500),
    foto_data LONGTEXT COMMENT 'Base64 encoded image',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_jalur_evakuasi_checklist FOREIGN KEY (checklist_id) 
        REFERENCES titik_kumpul_checklists(id) ON DELETE CASCADE,
    
    INDEX idx_checklist_id (checklist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
