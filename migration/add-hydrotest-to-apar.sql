-- Migration: Add hydrotest_date column to apar_items table
-- Description: Add hydrotest_date field to track when hydrostatic tests were conducted

-- Add hydrotest_date column if it doesn't exist
ALTER TABLE apar_items
ADD COLUMN IF NOT EXISTS hydrotest_date VARCHAR(50);

-- Create index for faster queries on hydrotest_date
CREATE INDEX IF NOT EXISTS idx_apar_items_hydrotest_date ON apar_items(hydrotest_date);

-- Optional: Backfill existing data with null values (already handled by ADD COLUMN IF NOT EXISTS)
-- No update needed as default will be NULL for existing rows

COMMIT;
