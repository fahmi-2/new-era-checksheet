-- Migration: Tambah kolom request_type pada tabel password_reset_requests
-- Jalankan migration ini di database PostgreSQL Anda
-- Tanggal: 2026-08-07

-- Tambah kolom request_type (nilai: 'password' atau 'username')
-- Default 'password' agar data lama tidak rusak
ALTER TABLE password_reset_requests
  ADD COLUMN IF NOT EXISTS request_type VARCHAR(20) NOT NULL DEFAULT 'password';

-- Tambah constraint check agar hanya menerima nilai valid
ALTER TABLE password_reset_requests
  ADD CONSTRAINT chk_request_type CHECK (request_type IN ('password', 'username'));

-- (Opsional) Update semua data lama menjadi 'password'
UPDATE password_reset_requests SET request_type = 'password' WHERE request_type IS NULL;

-- Verifikasi perubahan
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'password_reset_requests'
  AND column_name = 'request_type';
