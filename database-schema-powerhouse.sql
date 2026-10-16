-- database-schema-powerhouse.sql
-- Master equipments and inspection tables for Power House checklist

CREATE TABLE IF NOT EXISTS equipments (
    id VARCHAR(100) PRIMARY KEY,
    nama_alat VARCHAR(255) NOT NULL,
    area VARCHAR(100) DEFAULT 'Power House',
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_inspections (
    id VARCHAR(100) PRIMARY KEY,
    equipment_id VARCHAR(100) REFERENCES equipments(id) ON DELETE CASCADE,
    tgl DATE NOT NULL,
    shift INTEGER NOT NULL DEFAULT 1,
    pic VARCHAR(150) NOT NULL,
    score_percent NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    values_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspection_ng_items (
    id SERIAL PRIMARY KEY,
    inspection_id VARCHAR(100) REFERENCES equipment_inspections(id) ON DELETE CASCADE,
    field_key VARCHAR(100) NOT NULL,
    field_label VARCHAR(255),
    kondisi_aktual TEXT,
    tindakan_perbaikan TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_equipment_inspections_tgl ON equipment_inspections(tgl);
CREATE INDEX IF NOT EXISTS idx_equipment_inspections_equipment ON equipment_inspections(equipment_id);
CREATE INDEX IF NOT EXISTS idx_inspection_ng_items_inspection ON inspection_ng_items(inspection_id);
