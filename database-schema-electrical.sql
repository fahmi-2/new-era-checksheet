-- PostgreSQL Schema untuk Electrical Inspections (Instalasi Listrik & Stop Kontak)
-- Jalankan query ini di PostgreSQL untuk membuat table

-- Drop tables if exist (untuk development)
DROP TABLE IF EXISTS electrical_inspection_details CASCADE;
DROP TABLE IF EXISTS electrical_inspections CASCADE;

-- Create main inspection table
CREATE TABLE electrical_inspections (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL COMMENT 'instalasi-listrik or stop-kontak',
    tanggal DATE NOT NULL,
    area VARCHAR(255) NOT NULL,
    pic VARCHAR(255) NOT NULL,
    additional_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create details table
CREATE TABLE electrical_inspection_details (
    id SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES electrical_inspections(id) ON DELETE CASCADE,
    item_no INTEGER NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_detail TEXT,
    hasil VARCHAR(10) NOT NULL COMMENT 'OK or NOK',
    keterangan TEXT,
    foto_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_electrical_type_date ON electrical_inspections(type, tanggal);
CREATE INDEX idx_electrical_area_date ON electrical_inspections(area, tanggal);
CREATE INDEX idx_electrical_tanggal ON electrical_inspections(tanggal);
CREATE INDEX idx_electrical_details_inspection_id ON electrical_inspection_details(inspection_id);
CREATE INDEX idx_electrical_details_item_no ON electrical_inspection_details(item_no);

-- Add comments for documentation
COMMENT ON TABLE electrical_inspections IS 'Main table for electrical inspections (installation and stop contact)';
COMMENT ON TABLE electrical_inspection_details IS 'Detail items for each electrical inspection';
COMMENT ON COLUMN electrical_inspections.type IS 'Type of inspection: instalasi-listrik or stop-kontak';
