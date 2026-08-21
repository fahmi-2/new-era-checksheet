-- PostgreSQL Schema untuk Toilet Inspections
-- Jalankan query ini di database PostgreSQL untuk membuat table

CREATE TABLE IF NOT EXISTS toilet_inspections (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER,
    area_code VARCHAR(100) NOT NULL,
    area_name VARCHAR(255),
    inspection_date DATE NOT NULL,
    inspection_time VARCHAR(10),
    toilet_type VARCHAR(50) NOT NULL,
    inspector_name VARCHAR(255) NOT NULL,
    inspector_nik VARCHAR(50),

    -- Item inspections for Ladies (L)
    item_1_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_1_keterangan_l TEXT,
    item_1_foto_l TEXT,
    item_1_tindakan_l TEXT,
    item_1_pic_l VARCHAR(255),

    item_2_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_2_keterangan_l TEXT,
    item_2_foto_l TEXT,
    item_2_tindakan_l TEXT,
    item_2_pic_l VARCHAR(255),

    item_3_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_3_keterangan_l TEXT,
    item_3_foto_l TEXT,
    item_3_tindakan_l TEXT,
    item_3_pic_l VARCHAR(255),

    item_4_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_4_keterangan_l TEXT,
    item_4_foto_l TEXT,
    item_4_tindakan_l TEXT,
    item_4_pic_l VARCHAR(255),

    item_5_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_5_keterangan_l TEXT,
    item_5_foto_l TEXT,
    item_5_tindakan_l TEXT,
    item_5_pic_l VARCHAR(255),

    item_6_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_6_keterangan_l TEXT,
    item_6_foto_l TEXT,
    item_6_tindakan_l TEXT,
    item_6_pic_l VARCHAR(255),

    item_7_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_7_keterangan_l TEXT,
    item_7_foto_l TEXT,
    item_7_tindakan_l TEXT,
    item_7_pic_l VARCHAR(255),

    item_8_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_8_keterangan_l TEXT,
    item_8_foto_l TEXT,
    item_8_tindakan_l TEXT,
    item_8_pic_l VARCHAR(255),

    item_9_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_9_keterangan_l TEXT,
    item_9_foto_l TEXT,
    item_9_tindakan_l TEXT,
    item_9_pic_l VARCHAR(255),

    item_10_hasil_l VARCHAR(10) DEFAULT 'OK',
    item_10_keterangan_l TEXT,
    item_10_foto_l TEXT,
    item_10_tindakan_l TEXT,
    item_10_pic_l VARCHAR(255),

    -- Item inspections for Gentlemen (P)
    item_1_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_1_keterangan_p TEXT,
    item_1_foto_p TEXT,
    item_1_tindakan_p TEXT,
    item_1_pic_p VARCHAR(255),

    item_2_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_2_keterangan_p TEXT,
    item_2_foto_p TEXT,
    item_2_tindakan_p TEXT,
    item_2_pic_p VARCHAR(255),

    item_3_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_3_keterangan_p TEXT,
    item_3_foto_p TEXT,
    item_3_tindakan_p TEXT,
    item_3_pic_p VARCHAR(255),

    item_4_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_4_keterangan_p TEXT,
    item_4_foto_p TEXT,
    item_4_tindakan_p TEXT,
    item_4_pic_p VARCHAR(255),

    item_5_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_5_keterangan_p TEXT,
    item_5_foto_p TEXT,
    item_5_tindakan_p TEXT,
    item_5_pic_p VARCHAR(255),

    item_6_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_6_keterangan_p TEXT,
    item_6_foto_p TEXT,
    item_6_tindakan_p TEXT,
    item_6_pic_p VARCHAR(255),

    item_7_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_7_keterangan_p TEXT,
    item_7_foto_p TEXT,
    item_7_tindakan_p TEXT,
    item_7_pic_p VARCHAR(255),

    item_8_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_8_keterangan_p TEXT,
    item_8_foto_p TEXT,
    item_8_tindakan_p TEXT,
    item_8_pic_p VARCHAR(255),

    item_9_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_9_keterangan_p TEXT,
    item_9_foto_p TEXT,
    item_9_tindakan_p TEXT,
    item_9_pic_p VARCHAR(255),

    item_10_hasil_p VARCHAR(10) DEFAULT 'OK',
    item_10_keterangan_p TEXT,
    item_10_foto_p TEXT,
    item_10_tindakan_p TEXT,
    item_10_pic_p VARCHAR(255),

    -- Overall status
    overall_status VARCHAR(10) NOT NULL DEFAULT 'OK',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    CONSTRAINT unique_inspection UNIQUE (area_code, inspection_date, toilet_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_toilet_inspections_area_date ON toilet_inspections (area_code, inspection_date);
CREATE INDEX IF NOT EXISTS idx_toilet_inspections_inspection_date ON toilet_inspections (inspection_date);
CREATE INDEX IF NOT EXISTS idx_toilet_inspections_overall_status ON toilet_inspections (overall_status);

-- Comments
COMMENT ON TABLE toilet_inspections IS 'Table for toilet inspection records';
COMMENT ON COLUMN toilet_inspections.overall_status IS 'OK or NG - overall inspection result';
COMMENT ON COLUMN toilet_inspections.toilet_type IS 'Type of toilet (Ladies/Gentlemen)';
