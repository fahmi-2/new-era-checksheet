-- PostgreSQL Schema for Dashboard Integration
-- This creates all the tables needed by the GA Dashboard
-- Run this in your PostgreSQL database

-- ==================== TOILET RECORDS ====================
-- Table name expected by dashboard: toilet_records
DROP TABLE IF EXISTS toilet_records CASCADE;

CREATE TABLE toilet_records (
    id SERIAL PRIMARY KEY,
    date_key DATE NOT NULL,
    area VARCHAR(255),
    nik VARCHAR(50),
    shift VARCHAR(10) DEFAULT 'A',
    status VARCHAR(10) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_toilet_date_key ON toilet_records(date_key);
CREATE INDEX idx_toilet_status ON toilet_records(status);
CREATE INDEX idx_toilet_nik ON toilet_records(nik);

-- ==================== FIRE ALARM RECORDS ====================
-- Table name expected by dashboard: fire_alarm_records
DROP TABLE IF EXISTS fire_alarm_records CASCADE;

CREATE TABLE fire_alarm_records (
    id SERIAL PRIMARY KEY,
    date_key DATE NOT NULL,
    zona VARCHAR(100),
    area VARCHAR(255),
    nik VARCHAR(50),
    shift VARCHAR(10) DEFAULT 'A',
    status VARCHAR(10) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fire_alarm_date_key ON fire_alarm_records(date_key);
CREATE INDEX idx_fire_alarm_status ON fire_alarm_records(status);
CREATE INDEX idx_fire_alarm_zona ON fire_alarm_records(zona);
CREATE INDEX idx_fire_alarm_nik ON fire_alarm_records(nik);

-- ==================== EMERGENCY LAMP RECORDS ====================
-- Table name expected by dashboard: emergency_lamp_records
DROP TABLE IF EXISTS emergency_lamp_records CASCADE;

CREATE TABLE emergency_lamp_records (
    id SERIAL PRIMARY KEY,
    date_key DATE NOT NULL,
    area VARCHAR(255),
    nik VARCHAR(50),
    shift VARCHAR(10) DEFAULT 'A',
    status VARCHAR(10) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emergency_lamp_date_key ON emergency_lamp_records(date_key);
CREATE INDEX idx_emergency_lamp_status ON emergency_lamp_records(status);
CREATE INDEX idx_emergency_lamp_area ON emergency_lamp_records(area);
CREATE INDEX idx_emergency_lamp_nik ON emergency_lamp_records(nik);

-- ==================== LIFT BARANG RECORDS ====================
-- Table name expected by dashboard: lift_barang_records
DROP TABLE IF EXISTS lift_barang_records CASCADE;

CREATE TABLE lift_barang_records (
    id SERIAL PRIMARY KEY,
    date_key DATE NOT NULL,
    area VARCHAR(255),
    nik VARCHAR(50),
    shift VARCHAR(10) DEFAULT 'A',
    status VARCHAR(10) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lift_barang_date_key ON lift_barang_records(date_key);
CREATE INDEX idx_lift_barang_status ON lift_barang_records(status);
CREATE INDEX idx_lift_barang_area ON lift_barang_records(area);
CREATE INDEX idx_lift_barang_nik ON lift_barang_records(nik);

-- ==================== PANEL LISTRIK RECORDS ====================
-- Table name expected by dashboard: panel_listrik_records
DROP TABLE IF EXISTS panel_listrik_records CASCADE;

CREATE TABLE panel_listrik_records (
    id SERIAL PRIMARY KEY,
    date_key DATE NOT NULL,
    area VARCHAR(255),
    nik VARCHAR(50),
    shift VARCHAR(10) DEFAULT 'A',
    status VARCHAR(10) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_panel_listrik_date_key ON panel_listrik_records(date_key);
CREATE INDEX idx_panel_listrik_status ON panel_listrik_records(status);
CREATE INDEX idx_panel_listrik_area ON panel_listrik_records(area);
CREATE INDEX idx_panel_listrik_nik ON panel_listrik_records(nik);

-- ==================== STOP KONTAK RECORDS ====================
-- Table name expected by dashboard: stop_kontak_records
DROP TABLE IF EXISTS stop_kontak_records CASCADE;

CREATE TABLE stop_kontak_records (
    id SERIAL PRIMARY KEY,
    date_key DATE NOT NULL,
    area VARCHAR(255),
    nik VARCHAR(50),
    shift VARCHAR(10) DEFAULT 'A',
    status VARCHAR(10) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stop_kontak_date_key ON stop_kontak_records(date_key);
CREATE INDEX idx_stop_kontak_status ON stop_kontak_records(status);
CREATE INDEX idx_stop_kontak_area ON stop_kontak_records(area);
CREATE INDEX idx_stop_kontak_nik ON stop_kontak_records(nik);

-- ==================== TANGGA LISTRIK RECORDS ====================
-- Table name expected by dashboard: tangga_listrik_records
DROP TABLE IF EXISTS tangga_listrik_records CASCADE;

CREATE TABLE tangga_listrik_records (
    id SERIAL PRIMARY KEY,
    date_key DATE NOT NULL,
    area VARCHAR(255),
    nik VARCHAR(50),
    shift VARCHAR(10) DEFAULT 'A',
    status VARCHAR(10) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tangga_listrik_date_key ON tangga_listrik_records(date_key);
CREATE INDEX idx_tangga_listrik_status ON tangga_listrik_records(status);
CREATE INDEX idx_tangga_listrik_area ON tangga_listrik_records(area);
CREATE INDEX idx_tangga_listrik_nik ON tangga_listrik_records(nik);

-- ==================== APAR RECORDS (already exists, but add missing columns) ====================
-- Table name expected by dashboard: apar_records
-- Adding missing columns if they don't exist
ALTER TABLE apar_records ADD COLUMN IF NOT EXISTS date_key DATE;
ALTER TABLE apar_records ADD COLUMN IF NOT EXISTS area VARCHAR(255);
ALTER TABLE apar_records ADD COLUMN IF NOT EXISTS shift VARCHAR(10) DEFAULT 'A';
ALTER TABLE apar_records ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'OK';

-- Update date_key from date column if empty
UPDATE apar_records SET date_key = date WHERE date_key IS NULL;

CREATE INDEX IF NOT EXISTS idx_apar_date_key ON apar_records(date_key);
CREATE INDEX IF NOT EXISTS idx_apar_status ON apar_records(status);

-- ==================== VERIFY TABLES ====================
SELECT 'toilet_records' as table_name, COUNT(*) as row_count FROM toilet_records
UNION ALL
SELECT 'fire_alarm_records', COUNT(*) FROM fire_alarm_records
UNION ALL
SELECT 'emergency_lamp_records', COUNT(*) FROM emergency_lamp_records
UNION ALL
SELECT 'lift_barang_records', COUNT(*) FROM lift_barang_records
UNION ALL
SELECT 'panel_listrik_records', COUNT(*) FROM panel_listrik_records
UNION ALL
SELECT 'stop_kontak_records', COUNT(*) FROM stop_kontak_records
UNION ALL
SELECT 'tangga_listrik_records', COUNT(*) FROM tangga_listrik_records
UNION ALL
SELECT 'apar_records', COUNT(*) FROM apar_records;
