CREATE TABLE IF NOT EXISTS apd_master_labels (
    id SERIAL PRIMARY KEY,
    label_type VARCHAR(32) NOT NULL,    -- 'dept' | 'proses' | 'area'
    key VARCHAR(256) NOT NULL,          -- deptKey, prosesKey, atau 'prosesKey::subName::originalArea'
    custom_name TEXT NOT NULL,          -- Nama baru yang dimasukkan user
    updated_by VARCHAR(100),            -- NIK / Nama user yang mengubah
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_apd_master_labels UNIQUE (label_type, key)
);

CREATE INDEX IF NOT EXISTS idx_apd_master_labels_type_key ON apd_master_labels(label_type, key);

COMMENT ON TABLE apd_master_labels IS 'Menyimpan override nama kustom untuk departemen, proses, dan area';
COMMENT ON COLUMN apd_master_labels.key IS 'Key unik: deptKey (misal: PRODUKSI), prosesKey (misal: prod-pre-assy), atau komposit area (prosesKey::subName::originalArea)';


CREATE TABLE IF NOT EXISTS apd_master_departments (
    dept_key VARCHAR(64) PRIMARY KEY,
    dept_name VARCHAR(128) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apd_master_dept_order ON apd_master_departments(display_order ASC);


CREATE TABLE IF NOT EXISTS apd_master_processes (
    proses_key VARCHAR(128) PRIMARY KEY,
    dept_key VARCHAR(64) NOT NULL REFERENCES apd_master_departments(dept_key) ON UPDATE CASCADE ON DELETE RESTRICT,
    proses_name VARCHAR(256) NOT NULL,
    area_type VARCHAR(32) NOT NULL DEFAULT 'predefined-per-sub', -- 'predefined-per-sub' | 'cv' | 'none'
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apd_master_proc_dept ON apd_master_processes(dept_key);
CREATE INDEX IF NOT EXISTS idx_apd_master_proc_order ON apd_master_processes(display_order ASC);


CREATE TABLE IF NOT EXISTS apd_master_sub_processes (
    id SERIAL PRIMARY KEY,
    proses_key VARCHAR(128) NOT NULL REFERENCES apd_master_processes(proses_key) ON UPDATE CASCADE ON DELETE CASCADE,
    sub_name VARCHAR(256) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_apd_master_sub_proc UNIQUE (proses_key, sub_name)
);

CREATE INDEX IF NOT EXISTS idx_apd_master_sub_key ON apd_master_sub_processes(proses_key);
CREATE INDEX IF NOT EXISTS idx_apd_master_sub_order ON apd_master_sub_processes(display_order ASC);


CREATE TABLE IF NOT EXISTS apd_master_areas (
    id SERIAL PRIMARY KEY,
    sub_process_id INT NOT NULL REFERENCES apd_master_sub_processes(id) ON UPDATE CASCADE ON DELETE CASCADE,
    proses_key VARCHAR(128) NOT NULL,
    sub_name VARCHAR(256) NOT NULL,
    area_name VARCHAR(256) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_apd_master_area UNIQUE (proses_key, sub_name, area_name)
);

CREATE INDEX IF NOT EXISTS idx_apd_master_area_lookup ON apd_master_areas(proses_key, sub_name);


CREATE TABLE IF NOT EXISTS apd_master_change_logs (
    id SERIAL PRIMARY KEY,
    label_type VARCHAR(32) NOT NULL,    -- 'dept' | 'proses' | 'area'
    item_key VARCHAR(256) NOT NULL,
    old_name TEXT,
    new_name TEXT NOT NULL,
    action_type VARCHAR(32) NOT NULL,   -- 'RENAME' | 'RESET' | 'CREATE' | 'DEACTIVATE'
    changed_by VARCHAR(100),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apd_change_logs_key ON apd_master_change_logs(label_type, item_key);
CREATE INDEX IF NOT EXISTS idx_apd_change_logs_date ON apd_master_change_logs(changed_at DESC);


CREATE OR REPLACE VIEW v_apd_master_hierarchy AS
SELECT 
    d.dept_key,
    COALESCE(l_d.custom_name, d.dept_name) AS active_dept_name,
    d.dept_name AS original_dept_name,
    (l_d.custom_name IS NOT NULL) AS is_dept_renamed,

    p.proses_key,
    COALESCE(l_p.custom_name, p.proses_name) AS active_proses_name,
    p.proses_name AS original_proses_name,
    p.area_type,
    (l_p.custom_name IS NOT NULL) AS is_proses_renamed,

    s.id AS sub_process_id,
    s.sub_name,

    a.id AS area_id,
    COALESCE(l_a.custom_name, a.area_name) AS active_area_name,
    a.area_name AS original_area_name,
    (l_a.custom_name IS NOT NULL) AS is_area_renamed,
    (p.proses_key || '::' || s.sub_name || '::' || a.area_name) AS area_composite_key

FROM apd_master_departments d
JOIN apd_master_processes p ON p.dept_key = d.dept_key AND p.is_active = TRUE
JOIN apd_master_sub_processes s ON s.proses_key = p.proses_key AND s.is_active = TRUE
LEFT JOIN apd_master_areas a ON a.sub_process_id = s.id AND a.is_active = TRUE
LEFT JOIN apd_master_labels l_d ON l_d.label_type = 'dept' AND l_d.key = d.dept_key
LEFT JOIN apd_master_labels l_p ON l_p.label_type = 'proses' AND l_p.key = p.proses_key
LEFT JOIN apd_master_labels l_a ON l_a.label_type = 'area' AND l_a.key = (p.proses_key || '::' || s.sub_name || '::' || a.area_name)
WHERE d.is_active = TRUE
ORDER BY d.display_order, p.display_order, s.display_order, a.display_order;



INSERT INTO apd_master_departments (dept_key, dept_name, display_order)
VALUES
    ('PRODUKSI', 'PRODUKSI', 1),
    ('QA', 'QA', 2),
    ('GA', 'GA UTILITY', 3),
    ('GA-FASUM', 'GA FASUM', 4),
    ('GA-ENV', 'GA ENV', 5),
    ('WAREHOUSE', 'WAREHOUSE', 6),
    ('EXIM', 'EXIM', 7),
    ('MTC', 'MTC', 8),
    ('PROD-DESIGN', 'PROD. DESIGN', 9),
    ('PROD-ENG', 'PROD. ENG', 10)
ON CONFLICT (dept_key) DO UPDATE 
SET dept_name = EXCLUDED.dept_name, display_order = EXCLUDED.display_order;


INSERT INTO apd_master_processes (proses_key, dept_key, proses_name, area_type, display_order)
VALUES
    ('prod-pre-assy', 'PRODUKSI', 'PRE ASSY', 'predefined-per-sub', 1),
    ('prod-final-assy', 'PRODUKSI', 'FINAL ASSY', 'cv', 2),
    ('prod-cutting-tube', 'PRODUKSI', 'CUTTING TUBE', 'none', 3),
    
    ('qa-pre-assy', 'QA', 'INSPEKSI PRE ASSY', 'predefined-per-sub', 1),
    ('qa-final-assy', 'QA', 'INSPEKSI FINAL ASSY', 'predefined-per-sub', 2),
    ('qa-others', 'QA', 'REC. INSP & LAINNYA', 'none', 3),
    
    ('ga-util', 'GA', 'GA UTILITY', 'predefined-per-sub', 1),
    ('ga-fasum', 'GA-FASUM', 'GA FASUM', 'none', 1),
    ('ga-env', 'GA-ENV', 'GA ENV', 'none', 1),
    
    ('wh', 'WAREHOUSE', 'WAREHOUSE', 'predefined-per-sub', 1),
    ('exim', 'EXIM', 'EXIM', 'predefined-per-sub', 1),
    ('mtc', 'MTC', 'MTC', 'predefined-per-sub', 1),
    ('pd', 'PROD-DESIGN', 'PROD. DESIGN', 'predefined-per-sub', 1),
    ('pe', 'PROD-ENG', 'PROD. ENG', 'predefined-per-sub', 1)
ON CONFLICT (proses_key) DO UPDATE 
SET dept_key = EXCLUDED.dept_key,
    proses_name = EXCLUDED.proses_name,
    area_type = EXCLUDED.area_type,
    display_order = EXCLUDED.display_order;


INSERT INTO apd_master_sub_processes (proses_key, sub_name, display_order)
VALUES
    ('prod-pre-assy', 'Bonder', 1),
    ('prod-pre-assy', 'Bonder Minic', 2),
    ('prod-pre-assy', 'Anti Korosi (EJ30 & EJ35)', 3),
    ('prod-pre-assy', 'Raychem Alpha', 4),
    ('prod-pre-assy', 'Raychem Non-Alpha', 5),
    ('prod-pre-assy', 'Heat Shrink', 6),
    ('prod-pre-assy', 'Gun Solder', 7),
    ('prod-pre-assy', 'Dip Solder', 8),
    ('prod-pre-assy', 'Casting', 9),
    ('prod-pre-assy', 'Cutting', 10),
    ('prod-pre-assy', 'Transporter', 11),

    ('prod-final-assy', 'Shisui', 1),
    ('prod-final-assy', 'Sub Assy', 2),
    ('prod-final-assy', 'Taping', 3),
    ('prod-final-assy', 'Offline', 4),
    ('prod-final-assy', 'Siage', 5),
    ('prod-final-assy', 'Expander Grommet', 6),
    ('prod-final-assy', 'Vacuum', 7),
    ('prod-final-assy', 'CS / Material Supply', 8),

    ('prod-cutting-tube', 'Rolling Tube', 1),
    ('prod-cutting-tube', 'Chorobiki', 2),
    ('prod-cutting-tube', 'Cek COT / VO / CVO Manual', 3),
    ('prod-cutting-tube', 'Cutting COT/COTO', 4),
    ('prod-cutting-tube', 'Cutting VO/CVO', 5),
    ('prod-cutting-tube', 'Rewinding', 6),
    ('prod-cutting-tube', 'Reuse Wire', 7),
    ('prod-cutting-tube', 'Giling & Kupas Wire', 8),

    ('qa-pre-assy', 'Bonder', 1),
    ('qa-pre-assy', 'Bonder Minic', 2),
    ('qa-pre-assy', 'Anti Korosi (EJ30 & EJ35)', 3),
    ('qa-pre-assy', 'Raychem Alpha', 4),
    ('qa-pre-assy', 'Raychem Non-Alpha', 5),
    ('qa-pre-assy', 'Heat Shrink', 6),
    ('qa-pre-assy', 'Gun Solder', 7),
    ('qa-pre-assy', 'Dip Solder', 8),
    ('qa-pre-assy', 'Waterproof', 9),
    ('qa-pre-assy', 'Cross Section', 10),
    ('qa-pre-assy', 'Cutting', 11),

    ('qa-final-assy', 'Dry Surf', 1),
    ('qa-final-assy', 'Waterproof', 2),
    ('qa-final-assy', 'Checker & Packing', 3),

    ('qa-others', 'Receiving Inspection Material', 1),
    ('qa-others', 'Voltage Test', 2),
    ('qa-others', 'Pekerjaan Workshop', 3),

    ('ga-util', 'Pembersihan, Perbaikan Kipas & AC', 1),
    ('ga-util', 'Pengecekan Panel', 2),
    ('ga-util', 'Pengecekan Utility', 3),
    ('ga-util', 'Instalasi Listrik', 4),
    ('ga-util', 'Pengurusan Tandon Air, IPAL, Septick Tank', 5),
    ('ga-util', 'Pemasangan & Penggantian Lampu', 6),
    ('ga-util', 'Pekerjaan Workshop', 7),

    ('ga-fasum', 'Pengecatan Lantai & Dinding', 1),
    ('ga-fasum', 'Perbaikan Fasilitas Umum (Workshop)', 2),
    ('ga-fasum', 'Bekerja di Ketinggian', 3),

    ('ga-env', 'Pengambilan, Pembersihan, Packing, Pemuatan Limbah B3 & Non B3', 1),
    ('ga-env', 'Perusakan Scrap Limbah B3', 2),

    ('wh', 'Driver & Receiving Storage', 1),
    ('wh', 'Chorobiki Pre Assy', 2),
    ('wh', 'Ministore FA & Protector', 3),
    ('wh', 'Supply FA & Protector', 4),

    ('exim', 'Driver Forklift', 1),
    ('exim', 'Prepare Box', 2),
    ('exim', 'Supply Box & Finish Good', 3),

    ('mtc', 'Preventive', 1),
    ('mtc', 'Back Up Produksi', 2),

    ('pd', 'Back Up Produksi', 1),
    ('pd', 'Preventive', 2),
    ('pd', 'Preparation', 3),

    ('pe', 'Fabrikasi', 1),
    ('pe', 'Drawing', 2),
    ('pe', 'Back Up Produksi', 3),
    ('pe', 'Preventive', 4),
    ('pe', 'CNC', 5)
ON CONFLICT (proses_key, sub_name) DO UPDATE 
SET display_order = EXCLUDED.display_order;


INSERT INTO apd_master_areas (sub_process_id, proses_key, sub_name, area_name, display_order)
SELECT s.id, t.proses_key, t.sub_name, t.area_name, t.display_order
FROM (
    VALUES
    ('prod-pre-assy', 'Bonder', 'Mazda', 1),
    ('prod-pre-assy', 'Bonder', 'Toyota AMX', 2),
    ('prod-pre-assy', 'Bonder', 'Toyota TRX', 3),
    ('prod-pre-assy', 'Bonder', 'Toyota NPR & TNGA', 4),
    ('prod-pre-assy', 'Bonder', 'BCL', 5),
    ('prod-pre-assy', 'Bonder', 'Nissan', 6),

    ('prod-pre-assy', 'Bonder Minic', 'Toyota AMX', 1),
    ('prod-pre-assy', 'Bonder Minic', 'Toyota TRX', 2),
    ('prod-pre-assy', 'Bonder Minic', 'BCL', 3),

    ('prod-pre-assy', 'Anti Korosi (EJ30 & EJ35)', 'Toyota AMX', 1),
    ('prod-pre-assy', 'Anti Korosi (EJ30 & EJ35)', 'Toyota TRX', 2),
    ('prod-pre-assy', 'Anti Korosi (EJ30 & EJ35)', 'BCL', 3),

    ('prod-pre-assy', 'Raychem Alpha', 'Mazda', 1),
    ('prod-pre-assy', 'Raychem Alpha', 'Toyota AMX', 2),
    ('prod-pre-assy', 'Raychem Alpha', 'Toyota TRX', 3),
    ('prod-pre-assy', 'Raychem Alpha', 'Toyota NPR & TNGA', 4),
    ('prod-pre-assy', 'Raychem Alpha', 'BCL', 5),
    ('prod-pre-assy', 'Raychem Alpha', 'Nissan', 6),

    ('prod-pre-assy', 'Raychem Non-Alpha', 'Big Size', 1),
    ('prod-pre-assy', 'Raychem Non-Alpha', 'BCL', 2),
    ('prod-pre-assy', 'Raychem Non-Alpha', 'Nissan', 3),
    ('prod-pre-assy', 'Raychem Non-Alpha', 'Toyota NPR & TNGA', 4),

    ('prod-pre-assy', 'Heat Shrink', 'Mazda', 1),
    ('prod-pre-assy', 'Heat Shrink', 'Toyota AMX', 2),
    ('prod-pre-assy', 'Heat Shrink', 'Toyota TRX', 3),
    ('prod-pre-assy', 'Heat Shrink', 'Toyota NPR & TNGA', 4),
    ('prod-pre-assy', 'Heat Shrink', 'BCL', 5),
    ('prod-pre-assy', 'Heat Shrink', 'Nissan', 6),

    ('prod-pre-assy', 'Gun Solder', 'Nissan', 1),
    ('prod-pre-assy', 'Dip Solder', 'Nissan', 1),

    ('prod-pre-assy', 'Casting', 'Mazda', 1),
    ('prod-pre-assy', 'Casting', 'Toyota AMX', 2),
    ('prod-pre-assy', 'Casting', 'Toyota TRX', 3),
    ('prod-pre-assy', 'Casting', 'Toyota NPR & TNGA', 4),
    ('prod-pre-assy', 'Casting', 'BCL', 5),
    ('prod-pre-assy', 'Casting', 'Nissan', 6),

    ('prod-pre-assy', 'Cutting', 'Mazda', 1),
    ('prod-pre-assy', 'Cutting', 'Toyota AMX', 2),
    ('prod-pre-assy', 'Cutting', 'Toyota TRX', 3),
    ('prod-pre-assy', 'Cutting', 'Toyota NPR & TNGA', 4),
    ('prod-pre-assy', 'Cutting', 'BCL', 5),
    ('prod-pre-assy', 'Cutting', 'Nissan', 6),

    ('prod-pre-assy', 'Transporter', 'Area 01', 1),
    ('prod-pre-assy', 'Transporter', 'Area 02', 2),
    ('prod-pre-assy', 'Transporter', 'Area 03', 3),
    ('prod-pre-assy', 'Transporter', 'Area 04', 4),

    ('qa-pre-assy', 'Bonder', 'Mazda', 1),
    ('qa-pre-assy', 'Bonder', 'Toyota AMX', 2),
    ('qa-pre-assy', 'Bonder', 'Toyota TRX', 3),
    ('qa-pre-assy', 'Bonder', 'Toyota NPR & TNGA', 4),
    ('qa-pre-assy', 'Bonder', 'BCL', 5),
    ('qa-pre-assy', 'Bonder', 'Nissan', 6),

    ('qa-pre-assy', 'Bonder Minic', 'Toyota AMX', 1),
    ('qa-pre-assy', 'Bonder Minic', 'Toyota TRX', 2),
    ('qa-pre-assy', 'Bonder Minic', 'BCL', 3),

    ('qa-pre-assy', 'Anti Korosi (EJ30 & EJ35)', 'Toyota AMX', 1),
    ('qa-pre-assy', 'Anti Korosi (EJ30 & EJ35)', 'Toyota TRX', 2),
    ('qa-pre-assy', 'Anti Korosi (EJ30 & EJ35)', 'BCL', 3),

    ('qa-pre-assy', 'Raychem Alpha', 'Mazda', 1),
    ('qa-pre-assy', 'Raychem Alpha', 'Toyota AMX', 2),
    ('qa-pre-assy', 'Raychem Alpha', 'Toyota TRX', 3),
    ('qa-pre-assy', 'Raychem Alpha', 'Toyota NPR & TNGA', 4),
    ('qa-pre-assy', 'Raychem Alpha', 'BCL', 5),
    ('qa-pre-assy', 'Raychem Alpha', 'Nissan', 6),

    ('qa-pre-assy', 'Raychem Non-Alpha', 'Big Size', 1),
    ('qa-pre-assy', 'Raychem Non-Alpha', 'BCL', 2),
    ('qa-pre-assy', 'Raychem Non-Alpha', 'Nissan', 3),
    ('qa-pre-assy', 'Raychem Non-Alpha', 'Toyota NPR & TNGA', 4),

    ('qa-pre-assy', 'Heat Shrink', 'Mazda', 1),
    ('qa-pre-assy', 'Heat Shrink', 'Toyota AMX', 2),
    ('qa-pre-assy', 'Heat Shrink', 'Toyota TRX', 3),
    ('qa-pre-assy', 'Heat Shrink', 'Toyota NPR & TNGA', 4),
    ('qa-pre-assy', 'Heat Shrink', 'BCL', 5),
    ('qa-pre-assy', 'Heat Shrink', 'Nissan', 6),

    ('qa-pre-assy', 'Gun Solder', 'Nissan', 1),
    ('qa-pre-assy', 'Dip Solder', 'Nissan', 1),

    ('qa-final-assy', 'Dry Surf', 'Toyota AMX', 1),
    ('qa-final-assy', 'Dry Surf', 'Toyota TRX', 2),
    ('qa-final-assy', 'Dry Surf', 'Toyota NPR & TNGA', 3),

    ('qa-final-assy', 'Waterproof', 'Toyota AMX', 1),
    ('qa-final-assy', 'Waterproof', 'Toyota TRX', 2),

    ('qa-others', 'Receiving Inspection Material', 'Loading Dock Warehouse', 1),
    ('qa-others', 'Voltage Test', 'Jig Proto', 1),
    ('qa-others', 'Pekerjaan Workshop', 'Workshop', 1),

    ('ga-util', 'Pembersihan, Perbaikan Kipas & AC', 'Genba', 1),
    ('ga-util', 'Pembersihan, Perbaikan Kipas & AC', 'Office', 2),
    ('ga-util', 'Pengecekan Panel', 'Genba', 1),
    ('ga-util', 'Pengecekan Panel', 'Outside', 2),
    ('ga-util', 'Pengecekan Utility', 'Utility', 1),
    ('ga-util', 'Instalasi Listrik', 'All Area', 1),
    ('ga-util', 'Pengurusan Tandon Air, IPAL, Septick Tank', 'Pump Room', 1),
    ('ga-util', 'Pengurusan Tandon Air, IPAL, Septick Tank', 'IPAL', 2),
    ('ga-util', 'Pemasangan & Penggantian Lampu', 'All Area', 1),
    ('ga-util', 'Pekerjaan Workshop', 'Workshop', 1),

    ('wh', 'Driver & Receiving Storage', 'Main Rack', 1),
    ('wh', 'Driver & Receiving Storage', 'Loading Dock', 2),
    ('wh', 'Chorobiki Pre Assy', 'Main Rack', 1),
    ('wh', 'Chorobiki Pre Assy', 'Genba', 2),
    ('wh', 'Ministore FA & Protector', 'Ministore', 1),
    ('wh', 'Ministore FA & Protector', 'Genba', 2),
    ('wh', 'Supply FA & Protector', 'Ministore', 1),
    ('wh', 'Supply FA & Protector', 'Genba', 2),

    ('exim', 'Driver Forklift', 'Loading Dock', 1),
    ('exim', 'Prepare Box', 'Prepare Box', 1),
    ('exim', 'Supply Box & Finish Good', 'Loading Dock', 1),
    ('exim', 'Supply Box & Finish Good', 'Genba', 2),

    ('mtc', 'Preventive', 'Genba', 1),
    ('mtc', 'Back Up Produksi', 'Genba', 1),

    ('pd', 'Back Up Produksi', 'Genba', 1),
    ('pd', 'Preventive', 'Genba', 1),
    ('pd', 'Preparation', 'Jig Proto', 1),

    ('pe', 'Fabrikasi', 'Jig Proto', 1),
    ('pe', 'Drawing', 'Office', 1),
    ('pe', 'Back Up Produksi', 'Genba', 1),
    ('pe', 'Preventive', 'Genba', 1),
    ('pe', 'CNC', 'Area CNC', 1)
) AS t(proses_key, sub_name, area_name, display_order)
JOIN apd_master_sub_processes s 
  ON s.proses_key = t.proses_key 
 AND s.sub_name = t.sub_name
ON CONFLICT (proses_key, sub_name, area_name) DO UPDATE 
SET display_order = EXCLUDED.display_order;

-- ==============================================================================
-- 7. TABEL CUSTOM MASTER ITEMS (DIPAKAI API UNTUK ITEM YANG DITAMBAHKAN USER)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS apd_custom_master_items (
    id SERIAL PRIMARY KEY,
    item_type VARCHAR(32) NOT NULL,    -- 'dept' | 'proses' | 'sub' | 'area'
    parent_key VARCHAR(256),           -- deptKey untuk proses, prosesKey untuk sub, 'prosesKey::subName' untuk area
    item_key VARCHAR(256) NOT NULL,    -- identifier unik
    item_name TEXT NOT NULL,           -- nama item
    area_type VARCHAR(32) DEFAULT 'predefined-per-sub',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_apd_custom_item UNIQUE (item_type, item_key)
);

CREATE INDEX IF NOT EXISTS idx_apd_custom_parent ON apd_custom_master_items(item_type, parent_key);

