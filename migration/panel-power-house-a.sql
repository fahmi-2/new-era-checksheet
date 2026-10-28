-- ==============================================================================
-- Migration & Seeder: Checksheet Pengecekan Panel Listrik 3 Bulanan
-- Area: POWER HOUSE A (GENERATOR ROOM DAN PANEL ROOM)
-- Departemen: PGA Department - Utility Sect
-- ==============================================================================

-- 1. Pastikan kolom spv_frm, department, dan sub_area tersedia pada panel_inspections
ALTER TABLE panel_inspections 
ADD COLUMN IF NOT EXISTS spv_frm VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255) DEFAULT 'PGA Department - Utility Sect',
ADD COLUMN IF NOT EXISTS sub_area VARCHAR(255);

-- 2. Master Table untuk Master Area Panel & Item Panel (Reference & Seeder)
CREATE TABLE IF NOT EXISTS panel_master_areas (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    sub_area VARCHAR(255),
    department VARCHAR(255) DEFAULT 'PGA Department - Utility Sect',
    group_type VARCHAR(10) NOT NULL, -- 'A', 'B', 'C'
    months TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS panel_master_items (
    id SERIAL PRIMARY KEY,
    panel_id VARCHAR(100) UNIQUE NOT NULL,
    area_key VARCHAR(100) NOT NULL REFERENCES panel_master_areas(key) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    kategori VARCHAR(100) DEFAULT 'Panel Listrik 3 Bulanan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_panel_master_items_area ON panel_master_items(area_key);

-- 3. Seeder Area: POWER HOUSE A (Grup A: Januari, April, Juli, Oktober)
INSERT INTO panel_master_areas (key, label, sub_area, department, group_type, months)
VALUES (
    'PH-A',
    'POWER HOUSE A',
    'GENERATOR ROOM DAN PANEL ROOM',
    'PGA Department - Utility Sect',
    'A',
    ARRAY['Januari', 'April', 'Juli', 'Oktober']
)
ON CONFLICT (key) DO UPDATE 
SET label = EXCLUDED.label,
    sub_area = EXCLUDED.sub_area,
    department = EXCLUDED.department,
    group_type = EXCLUDED.group_type,
    months = EXCLUDED.months,
    updated_at = CURRENT_TIMESTAMP;

-- 4. Seeder 17 Item Panel untuk POWER HOUSE A (Urutan 1 - 17)
INSERT INTO panel_master_items (panel_id, area_key, sort_order, name, display_name)
VALUES
    ('PHA-FDR1',      'PH-A', 1,  'FEEDER 1',         'FEEDER 1'),
    ('PHA-FDR2',      'PH-A', 2,  'FEEDER 2',         'FEEDER 2'),
    ('PHA-CAP1',      'PH-A', 3,  'KAPASITOR BANK',   'KAPASITOR BANK 1'),
    ('PHA-MAIN-ACB',  'PH-A', 4,  'MAIN ACB',         'MAIN ACB'),
    ('PHA-AUTO-SYNK', 'PH-A', 5,  'AUTO SYNKRON',     'AUTO SYNKRON'),
    ('PHA-GCP-500',   'PH-A', 6,  'GCP 2X 500 KVA',   'GCP 2X 500 KVA'),
    ('PHA-GEN1',      'PH-A', 7,  'GENSET 1',         'GENSET 1'),
    ('PHA-GEN2',      'PH-A', 8,  'GENSET 2',         'GENSET 2'),
    ('PHA-LIP-ME',    'PH-A', 9,  'LIP ME',           'LIP ME'),
    ('PHA-BATT',      'PH-A', 10, 'BATTERY',          'BATTERY'),
    ('PHA-GND',       'PH-A', 11, 'GROUNDING',        'GROUNDING'),
    ('PHA-COMP1',     'PH-A', 12, 'COMPRESSOR 1',     'COMPRESSOR 1'),
    ('PHA-COMP2',     'PH-A', 13, 'COMPRESSOR 2',     'COMPRESSOR 2'),
    ('PHA-HYDRANT',   'PH-A', 14, 'PANEL HYDRANT',    'PANEL HYDRANT'),
    ('PHA-BOOSTER',   'PH-A', 15, 'BOOSTER PUMP',     'BOOSTER PUMP'),
    ('PHA-JB',        'PH-A', 16, 'JUNCTION BOX',     'JUNCTION BOX'),
    ('PHA-CAP2',      'PH-A', 17, 'KAPASITOR BANK',   'KAPASITOR BANK 2')
ON CONFLICT (panel_id) DO UPDATE 
SET sort_order = EXCLUDED.sort_order,
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    area_key = EXCLUDED.area_key;

-- Catatan Spesifikasi Item Check per Panel (9 Parameter Input & Standar):
-- 1. Temp (°C): Numerik, Max 65°C
-- 2. Bau: 'O', 'X', '⊗' (Tidak ada bau seperti benda terbakar)
-- 3. Suara: 'O', 'X', '⊗' (Tidak ada suara mendengung)
-- 4. 5S: 'O', 'X', '⊗' (Kondisi panel bersih luar dan dalam)
-- 5. Teg. Out MCCB - 3 Phase: Numerik / String (380V - 415V)
-- 6. Teg. Out MCCB - 1 Phase: Numerik / String (220V - 240V)
-- 7. Arus (A) - Phase R: Numerik (Menyesuaikan dengan MCCB)
-- 8. Arus (A) - Phase S: Numerik (Menyesuaikan dengan MCCB)
-- 9. Arus (A) - Phase T: Numerik (Menyesuaikan dengan MCCB)

