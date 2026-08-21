-- PostgreSQL Schema untuk APD (Alat Pelindung Diri) Inspections
-- Jalankan query ini di PostgreSQL untuk membuat table

-- Drop tables if exist (untuk development)
DROP TABLE IF EXISTS apd_items CASCADE;
DROP TABLE IF EXISTS apd_records CASCADE;

-- Create main records table
CREATE TABLE apd_records (
    id SERIAL PRIMARY KEY,
    jenis_apd VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    checker VARCHAR(255) NOT NULL,
    checker_nik VARCHAR(50),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create items table
CREATE TABLE apd_items (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL REFERENCES apd_records(id) ON DELETE CASCADE,
    no INTEGER NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nik VARCHAR(50) NOT NULL,
    tgl_pengambilan DATE NOT NULL,
    dept VARCHAR(100) NOT NULL,
    job_desc VARCHAR(255) NOT NULL,
    jumlah INTEGER NOT NULL DEFAULT 0,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_apd_records_jenis ON apd_records(jenis_apd);
CREATE INDEX idx_apd_records_date ON apd_records(date);
CREATE INDEX idx_apd_records_submitted ON apd_records(submitted_at DESC);
CREATE INDEX idx_apd_items_record_id ON apd_items(record_id);

-- Add comments for documentation
COMMENT ON TABLE apd_records IS 'Main table for APD inspection records';
COMMENT ON TABLE apd_items IS 'Detail items for each APD inspection record';
COMMENT ON COLUMN apd_records.jenis_apd IS 'Type of APD: helm-safety, sarung-tangan, masker, etc.';
