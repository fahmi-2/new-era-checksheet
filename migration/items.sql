    -- ============================================
    -- AREA 01: PRE ASSY AREA GENBA C (Produksi)
    -- ============================================


    -- BONDER (Set 1) - 1 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES01', 1, 'PROSES', 'BONDER', 'Visual', 1, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES01_APD01', 1, 'AREA01_PROSES01', 'Masker kain', 'Visual', 2, TRUE);

    -- BONDER (Set 2) - 1 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES02', 2, 'PROSES', 'BONDER', 'Visual', 3, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES02_APD01', 1, 'AREA01_PROSES02', 'Masker kain', 'Visual', 4, TRUE);

    -- RAYCHEM (Set 1) - 5 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES03', 3, 'PROSES', 'RAYCHEM', 'Visual', 5, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES03_APD01', 1, 'AREA01_PROSES03', 'Sarung tangan nitrile', 'Visual', 6, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES03_APD02', 2, 'AREA01_PROSES03', 'Sarung tangan katun', 'Visual', 7, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES03_APD03', 3, 'AREA01_PROSES03', 'Masker 3M (Respiratory)', 'Visual', 8, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES03_APD04', 4, 'AREA01_PROSES03', 'Celemek', 'Visual', 9, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES03_APD05', 5, 'AREA01_PROSES03', 'Kacamata bening', 'Visual', 10, TRUE);

    -- RAYCHEM (NON ALPHA) - 2 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES04', 4, 'PROSES', 'RAYCHEM (NON ALPHA)', 'Visual', 11, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES04_APD01', 1, 'AREA01_PROSES04', 'Masker FKA', 'Visual', 12, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES04_APD02', 2, 'AREA01_PROSES04', 'Sarung tangan nitrile', 'Visual', 13, TRUE);

    -- HEAT SHRINK - 2 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES05', 5, 'PROSES', 'HEAT SHRINK', 'Visual', 14, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES05_APD01', 1, 'AREA01_PROSES05', 'Masker kain', 'Visual', 15, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES05_APD02', 2, 'AREA01_PROSES05', 'Sarung tangan nitrile', 'Visual', 16, TRUE);

    -- CASTING - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES06', 6, 'PROSES', 'CASTING', 'Visual', 17, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES06_APD01', 1, 'AREA01_PROSES06', 'Back support', 'Visual', 18, TRUE);

    -- CUTTING (Set 1) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES07', 7, 'PROSES', 'CUTTING', 'VISUAL', 19, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES07_APD01', 1, 'AREA01_PROSES07', 'Back Support', 'Visual', 20, TRUE);

    -- CUTTING (Set 2) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES08', 8, 'PROSES', 'CUTTING', 'VISUAL', 21, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES08_APD01', 1, 'AREA01_PROSES08', 'Back Support', 'Visual', 22, TRUE);

    -- CUTTING (Set 3) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES09', 9, 'PROSES', 'CUTTING', 'VISUAL', 23, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES09_APD01', 1, 'AREA01_PROSES09', 'Back Support', 'Visual', 24, TRUE);

    -- CUTTING (Set 4) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES10',10, 'PROSES', 'CUTTING', 'VISUAL', 25, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES10_APD01', 1, 'AREA01_PROSES10', 'Back Support', 'Visual', 26, TRUE);

    -- CUTTING & RUBBER SEAL (Set 1) - 2 APD Item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES11', 11, 'PROSES', 'CUTTING & RUBBER-SEAL', 'Visual' ,27, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES11_APD01', 1, 'AREA01_PROSES11', 'Back Support', 'Visual', 28, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES11_APD02', 2, 'AREA01_PROSES11', 'Ear Plug', 'Visual', 29, TRUE);

    -- CUTTING & RUBBER SEAL (Set 2) - 2 APD Item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES12', 12, 'PROSES', 'CUTTING & RUBBER-SEAL', 'Visual' ,30, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES12_APD01', 1, 'AREA01_PROSES12', 'Back Support', 'Visual', 31, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA01_PROSES12_APD02', 2, 'AREA01_PROSES12', 'Ear Plug', 'Visual', 32, TRUE);


    -- ============================================
    -- AREA 02: PRE ASSY GENBA A+B (Produksi)
    -- ============================================

    -- RAYCHEM (Set 1) - 4 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES01', 1, 'PROSES', 'RAYCHEM', 'Visual', 33, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES01_APD01', 1, 'AREA02_PROSES01', 'Sarung tangan nitrile', 'Visual', 34, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES01_APD02', 2, 'AREA02_PROSES01', 'Masker 3M (Respiratory)', 'Visual', 35, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES01_APD03', 3, 'AREA02_PROSES01', 'Celemek', 'Visual', 36, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES01_APD04', 4, 'AREA02_PROSES01', 'Kacamata bening', 'Visual', 37, TRUE);

    -- RAYCHEM (Set 2) - 4 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES02', 2, 'PROSES', 'RAYCHEM', 'Visual', 38, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES02_APD01', 1, 'AREA02_PROSES02', 'Sarung tangan nitrile', 'Visual', 39, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES02_APD02', 2, 'AREA02_PROSES02', 'Masker 3M (Respiratory)', 'Visual', 40, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES02_APD03', 3, 'AREA02_PROSES02', 'Celemek', 'Visual', 41, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES02_APD04', 4, 'AREA02_PROSES02', 'Kacamata bening', 'Visual', 42, TRUE);

    -- RAYCHEM NON ALPHA (Set 1) - 2 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES03', 3, 'PROSES', 'RAYCHEM NON ALPHA', 'Visual', 43, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES03_APD01', 1, 'AREA02_PROSES03', 'Masker FKA', 'Visual', 44, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES03_APD02', 2, 'AREA02_PROSES03', 'Sarung tangan nitrile', 'Visual', 45, TRUE);

    -- RAYCHEM NON ALPHA (Set 2) - 2 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES04', 4, 'PROSES', 'RAYCHEM NON ALPHA', 'Visual', 46, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES04_APD01', 1, 'AREA02_PROSES04', 'Masker kain', 'Visual', 47, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES04_APD02', 2, 'AREA02_PROSES04', 'Sarung tangan nitrile', 'Visual', 48, TRUE);

    -- GUN SOLDER (AMERICAN BEAUTY) - 4 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES05', 5, 'PROSES', 'GUN SOLDER (AMERICAN BEAUTY)', 'Visual', 49, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES05_APD01', 1, 'AREA02_PROSES05', 'Kacamata bening', 'Visual', 50, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES05_APD02', 2, 'AREA02_PROSES05', 'Masker FKA', 'Visual', 51, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES05_APD03', 3, 'AREA02_PROSES05', 'Sarung tangan nitrile', 'Visual', 52, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES05_APD04', 4, 'AREA02_PROSES05', 'Celemek', 'Visual', 53, TRUE);

    -- DIP SOLDER - 6 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES06', 6, 'PROSES', 'DIP SOLDER', 'Visual', 54, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES06_APD01', 1, 'AREA02_PROSES06', 'Sarung tangan kulit', 'Visual', 55, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES06_APD02', 2, 'AREA02_PROSES06', 'Sarung tangan katun', 'Visual', 56, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES06_APD03', 3, 'AREA02_PROSES06', 'Masker FKA', 'Visual', 57, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES06_APD04', 4, 'AREA02_PROSES06', 'Topeng Gerinda', 'Visual', 58, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES06_APD05', 5, 'AREA02_PROSES06', 'Celemek', 'Visual', 59, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES06_APD06', 6, 'AREA02_PROSES06', 'Sleave', 'Visual', 60, TRUE);

    -- BONDER (200D) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES07', 7, 'PROSES', 'BONDER (200D)', 'Visual', 61, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES07_APD01', 1, 'AREA02_PROSES07', 'Masker FKA', 'Visual', 62, TRUE);

    -- BONDER (900B) + DFM - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES08', 8, 'PROSES', 'BONDER (900B) + DFM', 'Visual', 63, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES08_APD01', 1, 'AREA02_PROSES08', 'Masker FKA', 'Visual', 64, TRUE);

    -- BONDER - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES09', 9, 'PROSES', 'BONDER', 'Visual', 65, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES09_APD01', 1, 'AREA02_PROSES09', 'Masker FKA', 'Visual', 66, TRUE);

    -- BONDER MINIC MN20 (200D) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES10', 10, 'PROSES', 'BONDER MINIC MN20 (200D)', 'Visual', 67, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES10_APD01', 1, 'AREA02_PROSES10', 'Masker FKA', 'Visual', 68, TRUE);

    -- BONDER MINIC MN20 (900B) (Set 1) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES11', 11, 'PROSES', 'BONDER MINIC MN20 (900B)', 'Visual', 69, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES11_APD01', 1, 'AREA02_PROSES11', 'Masker FKA', 'Visual', 70, TRUE);

    -- BONDER MINIC MN20 (900B) (Set 2) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES12', 12, 'PROSES', 'BONDER MINIC MN20 (900B)', 'Visual', 71, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES12_APD01', 1, 'AREA02_PROSES12', 'Masker FKA', 'Visual', 72, TRUE);

    -- ANTI KOROSI (EJ30 & EJ35) (Set 1) - 4 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES13', 13, 'PROSES', 'ANTI KOROSI (EJ30 & EJ35)', 'Visual', 73, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES13_APD01', 1, 'AREA02_PROSES13', 'Sarung tangan Anti UV', 'Visual', 74, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES13_APD02', 2, 'AREA02_PROSES13', 'Masker FKA', 'Visual', 75, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES13_APD03', 3, 'AREA02_PROSES13', 'Kacamata/Face shield Anti UV', 'Visual', 76, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES13_APD04', 4, 'AREA02_PROSES13', 'Celemek', 'Visual', 77, TRUE);

    -- ANTI KOROSI (EJ30 & EJ35) (Set 2) - 4 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES14', 14, 'PROSES', 'ANTI KOROSI (EJ30 & EJ35)', 'Visual', 78, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES14_APD01', 1, 'AREA02_PROSES14', 'Sarung tangan Anti UV', 'Visual', 79, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES14_APD02', 2, 'AREA02_PROSES14', 'Masker FKA', 'Visual', 80, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES14_APD03', 3, 'AREA02_PROSES14', 'Kacamata/Face shield Anti UV', 'Visual', 81, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES14_APD04', 4, 'AREA02_PROSES14', 'Celemek', 'Visual', 82, TRUE);

    -- ANTI KOROSI (EJ30 & EJ35) (Set 3) - 4 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES15', 15, 'PROSES', 'ANTI KOROSI (EJ30 & EJ35)', 'Visual', 83, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES15_APD01', 1, 'AREA02_PROSES15', 'Sarung tangan Anti UV', 'Visual', 84, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES15_APD02', 2, 'AREA02_PROSES15', 'Masker FKA', 'Visual', 85, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES15_APD03', 3, 'AREA02_PROSES15', 'Kacamata/Face shield Anti UV', 'Visual', 86, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES15_APD04', 4, 'AREA02_PROSES15', 'Celemek', 'Visual', 87, TRUE);

    -- HEAT SHRINK (Set 1) - 2 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES16', 16, 'PROSES', 'HEAT SHRINK', 'Visual', 88, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES16_APD01', 1, 'AREA02_PROSES16', 'Masker FKA', 'Visual', 89, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES16_APD02', 2, 'AREA02_PROSES16', 'Sarung tangan nitrile', 'Visual', 90, TRUE);

    -- HEAT SHRINK (Set 2) - 2 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES17', 17, 'PROSES', 'HEAT SHRINK', 'Visual', 91, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES17_APD01', 1, 'AREA02_PROSES17', 'Masker FKA', 'Visual', 92, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES17_APD02', 2, 'AREA02_PROSES17', 'Sarung tangan nitrile', 'Visual', 93, TRUE);

    -- CUTTING: Nissan (Genba A) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES18', 18, 'PROSES', 'Nissan (Genba A)', 'Visual', 94, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES18_APD01', 1, 'AREA02_PROSES18', 'Back support', 'Visual', 95, TRUE);

    -- CUTTING: Nissan (Genba B)(Set 1) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES19', 19, 'PROSES', 'Nissan (Genba B)', 'Visual', 96, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES19_APD01', 1, 'AREA02_PROSES19', 'Back support', 'Visual', 97, TRUE);

    -- CUTTING: Nissan (Genba B)(Set 2) - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES20', 20, 'PROSES', 'Nissan (Genba B)', 'Visual', 98, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES20_APD01', 1, 'AREA02_PROSES20', 'Back support', 'Visual', 99, TRUE);

    -- CUTTING: Mazda - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES21', 21, 'PROSES', 'Mazda', 'Visual', 100, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES21_APD01', 1, 'AREA02_PROSES21', 'Back support', 'Visual', 101, TRUE);

    -- CUTTING: Mazda - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES22', 22, 'PROSES', 'Mazda', 'Visual', 102, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES22_APD01', 1, 'AREA02_PROSES22', 'Back support', 'Visual', 103, TRUE);

    -- CUTTING: Mazda - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES23', 23, 'PROSES', 'Mazda', 'Visual', 104, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES23_APD01', 1, 'AREA02_PROSES23', 'Back support', 'Visual', 105, TRUE);

    -- CUTTING: Mazda - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES24', 24, 'PROSES', 'Mazda', 'Visual', 106, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES24_APD01', 1, 'AREA02_PROSES24', 'Back support', 'Visual', 107, TRUE);

    -- CUTTING: Mazda - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES25', 25, 'PROSES', 'Mazda', 'Visual', 108, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES25_APD01', 1, 'AREA02_PROSES25', 'Back support', 'Visual', 109, TRUE);

    -- CUTTING: Mazda - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES26', 26, 'PROSES', 'Mazda', 'Visual', 110, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES26_APD01', 1, 'AREA02_PROSES26', 'Back support', 'Visual', 111, TRUE);

    -- CUTTING: Mazda - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES27', 27, 'PROSES', 'Mazda', 'Visual', 112, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES27_APD01', 1, 'AREA02_PROSES27', 'Back support', 'Visual', 113, TRUE);

    -- CUTTING: Mazda - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES28', 28, 'PROSES', 'Mazda', 'Visual', 114, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES28_APD01', 1, 'AREA02_PROSES28', 'Back support', 'Visual', 115, TRUE);

    -- CUTTING: Mazda - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES29', 29, 'PROSES', 'Mazda', 'Visual', 116, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES29_APD01', 1, 'AREA02_PROSES29', 'Back support', 'Visual', 117, TRUE);

    -- CUTTING: 900B & 200D - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES30', 30, 'PROSES', '900B & 200D', 'Visual', 118, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES30_APD01', 1, 'AREA02_PROSES30', 'Back support', 'Visual', 119, TRUE);

    -- CUTTING: 900B & 200D - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES31', 31, 'PROSES', '900B & 200D', 'Visual', 120, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES31_APD01', 1, 'AREA02_PROSES31', 'Back support', 'Visual', 121, TRUE);

    -- CUTTING: 900B & 200D - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES32', 32, 'PROSES', '900B & 200D', 'Visual', 122, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES32_APD01', 1, 'AREA02_PROSES32', 'Back support', 'Visual', 123, TRUE);

    -- CUTTING: 900B & 200D - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES33', 33, 'PROSES', '900B & 200D', 'Visual', 124, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES33_APD01', 1, 'AREA02_PROSES33', 'Back support', 'Visual', 125, TRUE);

    -- CUTTING: 900B & 200D - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES34', 34, 'PROSES', '900B & 200D', 'Visual', 126, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES34_APD01', 1, 'AREA02_PROSES34', 'Back support', 'Visual', 127, TRUE);

    -- CUTTING: 900B & 200D - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES35', 35, 'PROSES', '900B & 200D', 'Visual', 128, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES35_APD01', 1, 'AREA02_PROSES35', 'Back support', 'Visual', 129, TRUE);

    -- TRANSFORTER - 1 APD item
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES36', 36, 'PROSES', 'TRANSFORTER', 'Visual', 130, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES36_APD01', 1, 'AREA02_PROSES36', 'Topi pelindung', 'Visual', 131, TRUE);

    -- CASTING (Set 1) - 2 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES37', 37, 'PROSES', 'CASTING', 'Visual', 132, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES37_APD01', 1, 'AREA02_PROSES37', 'Back support', 'Visual', 133, TRUE);

    -- CASTING (Set 2) - 2 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES38', 38, 'PROSES', 'CASTING', 'Visual', 134, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES38_APD01', 1, 'AREA02_PROSES38', 'Back support', 'Visual', 135, TRUE);

    -- CASTING (Set 3) - 2 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES39', 39, 'PROSES', 'CASTING', 'Visual', 136, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES39_APD01', 1, 'AREA02_PROSES39', 'Back support', 'Visual', 137, TRUE);

    -- CASTING (Set 4) - 3 APD items
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES40', 40, 'PROSES', 'CASTING', 'Visual', 138, TRUE);
    INSERT INTO ga_checksheet_items (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) VALUES
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES40_APD01', 1, 'AREA02_PROSES40', 'Back support', 'Visual', 139, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES40_APD02', 2, 'AREA02_PROSES40', 'Sarung tangan PU', 'Visual', 140, TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 'AREA02_PROSES40_APD03', 3, 'AREA02_PROSES40', 'Safety Shoes', 'Visual', 141, TRUE);

    -- ============================================
    -- AREA 03: AREA FINAL ASSY (Produksi)
    -- ============================================

    INSERT INTO ga_checksheet_items 
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) 
    VALUES

                                                                                                                                
    -- 1. INJECTION GROMET
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P01',1,'PROSES','INJECTION GROMET','Visual',142,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P01_01',1,'AREA03_P01','Sarung tangan nitrile','Visual',143,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P01_02',2,'AREA03_P01','Masker FKA','Visual',144,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P01_03',3,'AREA03_P01','Celemek','Visual',145,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P01_04',4,'AREA03_P01','Kacamata bening','Visual',146,TRUE),

    -- 2. SISUI
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P02',2,'PROSES','SISUI','Visual',147,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P02_01',1,'AREA03_P02','Topi pelindung','Visual',148,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P02_02',2,'AREA03_P02','Kacamata bening (u/ pengambilan sample)','Visual',149,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P02_03',3,'AREA03_P02','Celemek','Visual',150,TRUE),

    -- 3. SISUI
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P03',3,'PROSES','SISUI','Visual',151,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P03_01',1,'AREA03_P03','Topi pelindung','Visual',152,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P03_02',2,'AREA03_P03','Kacamata bening (u/ pengambilan sample)','Visual',153,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P03_03',3,'AREA03_P03','Celemek','Visual',154,TRUE),

    -- 4. SISUI
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P04',4,'PROSES','SISUI','Visual',155,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P04_01',1,'AREA03_P04','Topi pelindung','Visual',156,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P04_02',2,'AREA03_P04','Kacamata bening (u/ pengambilan sample)','Visual',157,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P04_03',3,'AREA03_P04','Celemek','Visual',158,TRUE),

    -- 5. SUB ASSY
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P05',5,'PROSES','SUB ASSY','Visual',159,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P05_01',1,'AREA03_P05','Sarung tangan PU','Visual',160,TRUE),

    -- 6. EXPANDER GROMMET
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P06',6,'PROSES','EXPANDER GROMMET','Visual',161,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P06_01',1,'AREA03_P06','Sarung tangan nitrile','Visual',162,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P06_02',2,'AREA03_P06','Back support','Visual',163,TRUE),

    -- 7. EXPANDER GROMMET
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P07',7,'PROSES','EXPANDER GROMMET','Visual',164,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P07_01',1,'AREA03_P07','Sarung tangan nitrile','Visual',165,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P07_02',2,'AREA03_P07','Back support','Visual',166,TRUE),

    -- 8. SP (AB1)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P08',8,'PROSES','SP (AB1)','Visual',167,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P08_01',1,'AREA03_P08','Topi pelindung','Visual',168,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P08_02',2,'AREA03_P08','Sarung tangan PU','Visual',169,TRUE),

    -- 9. CS, MATERIAL SUPPLY (AB1)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P09',9,'PROSES','CS, MATERIAL SUPPLY (AB1)','Visual',170,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P09_01',1,'AREA03_P09','Topi pelindung','Visual',171,TRUE),

    -- 10. VACUUM
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P10',10,'PROSES','VACUUM','Visual',172,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P10_01',1,'AREA03_P10','Ear plug','Visual',173,TRUE),

    -- 11-15. SIAGE (5x sesuai data)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P11',11,'PROSES','SIAGE','Visual',174,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P11_01',1,'AREA03_P11','Back support','Visual',175,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P11_02',2,'AREA03_P11','Sarung tangan PU','Visual',176,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P12',12,'PROSES','SIAGE','Visual',177,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P12_01',1,'AREA03_P12','Back support','Visual',178,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P12_02',2,'AREA03_P12','Sarung tangan PU','Visual',179,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P13',13,'PROSES','SIAGE','Visual',180,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P13_01',1,'AREA03_P13','Back support','Visual',181,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P13_02',2,'AREA03_P13','Sarung tangan PU','Visual',182,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P14',14,'PROSES','SIAGE','Visual',183,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P14_01',1,'AREA03_P14','Back support','Visual',184,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P14_02',2,'AREA03_P14','Sarung tangan PU','Visual',185,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P15',15,'PROSES','SIAGE','Visual',186,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P15_01',1,'AREA03_P15','Back support','Visual',187,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P15_02',2,'AREA03_P15','Sarung tangan PU','Visual',188,TRUE),

    -- 16. TAPING
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P16',16,'PROSES','Taping','Visual',189,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P16_01',1,'AREA03_P16','Sarung tangan','Visual',190,TRUE),

    -- 17. OFFLINE
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P17',17,'PROSES','Offline','Visual',191,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA03_P17_01',1,'AREA03_P17','Sarung tangan','Visual',192,TRUE);


    -- =====================================================
    -- AREA 04 : CUTTING TUBE (Produksi)
    -- =====================================================

    INSERT INTO ga_checksheet_items 
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) 
    VALUES

    -- 1. Rolling VO / CVO
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P01',1,'PROSES','Rolling VO / CVO','Visual',193,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P01_01',1,'AREA04_P01','Masker FKA','Visual',194,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P01_02',2,'AREA04_P01','Celemek','Visual',195,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P01_03',3,'AREA04_P01','Sarung tangan katun','Visual',196,TRUE),

    -- 2. Cutting Tape Manual Air Bag
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P02',2,'PROSES','Cutting Tape Manual Air Bag','Visual',197,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P02_01',1,'AREA04_P02','Sarung tangan cut resistance','Visual',198,TRUE),

    -- 3. Cek COT, VO, CVO Manual
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P03',3,'PROSES','Cek COT, VO, CVO Manual','Visual',199,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P03_01',1,'AREA04_P03','ST. katun','Visual',200,TRUE),

    -- 4. Cutting COT
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P04',4,'PROSES','Cutting COT','Visual',201,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P04_01',1,'AREA04_P04','Sarung tangan katun','Visual',202,TRUE),

    -- 5. Cutting COT (duplicate proses)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P05',5,'PROSES','Cutting COT','Visual',203,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P05_01',1,'AREA04_P05','Sarung tangan katun','Visual',204,TRUE),

    -- 6. Cutting CVO
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P06',6,'PROSES','Cutting CVO','Visual',205,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P06_01',1,'AREA04_P06','Sarung tangan katun','Visual',206,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P06_02',2,'AREA04_P06','Masker kain','Visual',207,TRUE),

    -- 7. Cutting CVO (duplicate proses)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P07',7,'PROSES','Cutting CVO','Visual',208,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P07_01',1,'AREA04_P07','Sarung tangan katun','Visual',209,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P07_02',2,'AREA04_P07','Masker kain','Visual',210,TRUE),

    -- 8. Reuse wire
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P08',8,'PROSES','Reuse wire','Visual',211,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P08_01',1,'AREA04_P08','Sarung tangan coating','Visual',212,TRUE),

    -- 9. Rewinding
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P09',9,'PROSES','Rewinding','Visual',213,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P09_01',1,'AREA04_P09','Back support','Visual',214,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P09_02',2,'AREA04_P09','Sarung tangan bintil','Visual',215,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P09_03',3,'AREA04_P09','Safety shoes','Visual',216,TRUE),

    -- 10. Giling & Kupas wire
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P10',10,'PROSES','Giling & Kupas wire','Visual',217,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P10_01',1,'AREA04_P10','Sarung tangan bintil','Visual',218,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P10_02',2,'AREA04_P10','Kacamata','Visual',219,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P10_03',3,'AREA04_P10','Masker kain','Visual',220,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P10_04',4,'AREA04_P10','celemek (plastik)','Visual',221,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA04_P10_05',5,'AREA04_P10','Sarung tangan nitrile','Visual',222,TRUE);


    -- =====================================================
    -- AREA 05 : INSPEKSI PRE ASSY AREA GENBA C (QA)
    -- =====================================================

    INSERT INTO ga_checksheet_items 
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) 
    VALUES

    -- 1. INSP. WATER PROOF
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P01',1,'PROSES','INSP. WATER PROOF','Visual',223,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P01_01',1,'AREA05_P01','Ear plug','Visual',224,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P01_02',2,'AREA05_P01','Masker FKA','Visual',225,TRUE),

    -- 2. INSP. CROSS SECTION
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P02',2,'PROSES','INSP. CROSS SECTION','Visual',226,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P02_01',1,'AREA05_P02','Kacamata bening','Visual',227,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P02_02',2,'AREA05_P02','Masker FKA','Visual',228,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P02_03',3,'AREA05_P02','Sarung tangan PU','Visual',229,TRUE),

    -- 3. INSP. BONDER & RAYCHEM
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P03',3,'PROSES','INSP. BONDER & RAYCHEM','Visual',230,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P03_01',1,'AREA05_P03','Masker FKA','Visual',231,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P03_02',2,'AREA05_P03','Sarung tangan nitrile','Visual',232,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P03_03',3,'AREA05_P03','Celemek','Visual',233,TRUE),

    -- 4. INSP. BONDER
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P04',4,'PROSES','INSP. BONDER','Visual',234,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P04_01',1,'AREA05_P04','Masker FKA','Visual',235,TRUE),

    -- 5. INSP. CUTTING
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P05',5,'PROSES','INSP. CUTTING','Visual',236,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P05_01',1,'AREA05_P05','Topi pelindung','Visual',237,TRUE),

    -- 6. INSP. CUTTING (duplicate proses)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P06',6,'PROSES','INSP. CUTTING','Visual',238,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P06_01',1,'AREA05_P06','Topi pelindung','Visual',239,TRUE),

    -- 7. RED INK & CROSS SECTION
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P07',7,'PROSES','RED INK & CROSS SECTION','Visual',240,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P07_01',1,'AREA05_P07','Masker FKA','Visual',241,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P07_02',2,'AREA05_P07','Sarung tangan PU','Visual',242,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P07_03',3,'AREA05_P07','Celemek','Visual',243,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P07_04',4,'AREA05_P07','Kacamata bening','Visual',244,TRUE),

    -- 8. INSP. CUTTING AREA FTZ
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P08',8,'PROSES','INSP. CUTTING AREA FTZ','Visual',245,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA05_P08_01',1,'AREA05_P08','Ear plug','Visual',246,TRUE);


    -- =====================================================
    -- AREA 06 : INSPEKSI PRE ASSY GENBA A+B (QA)
    -- =====================================================

    INSERT INTO ga_checksheet_items 
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active) 
    VALUES

    -- 1. INSP. BONDER/MINIC + RAYCHEM/DIP SOLD
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P01',1,'PROSES','INSP. BONDER/MINIC + RAYCHEM/DIP SOLD','Visual',247,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P01_01',1,'AREA06_P01','Masker FKA','Visual',248,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P01_02',2,'AREA06_P01','Sarung tangan Nitril','Visual',249,TRUE),

    -- 2. INSP. BONDER/MINIC + RAYCHEM/DIP SOLD (duplicate proses)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P02',2,'PROSES','INSP. BONDER/MINIC + RAYCHEM/DIP SOLD','Visual',250,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P02_01',1,'AREA06_P02','Masker FKA','Visual',251,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P02_02',2,'AREA06_P02','Sarung tangan Nitril','Visual',252,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P02_03',3,'AREA06_P02','Celemek','Visual',253,TRUE),

    -- 3. INSP. CROSS SECTION
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P03',3,'PROSES','INSP. CROSS SECTION','Visual',254,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P03_01',1,'AREA06_P03','Kacamata bening','Visual',255,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P03_02',2,'AREA06_P03','Masker FKA','Visual',256,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P03_03',3,'AREA06_P03','Celemek','Visual',257,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P03_04',4,'AREA06_P03','Sarung tangan Coating','Visual',258,TRUE),

    -- 4. INSP. BONDER MINIC
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P04',4,'PROSES','INSP. BONDER MINIC','Visual',259,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P04_01',1,'AREA06_P04','Masker FKA','Visual',260,TRUE),

    -- 5. INSP. UV
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P05',5,'PROSES','INSP. UV','Visual',261,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P05_01',1,'AREA06_P05','Face sheild','Visual',262,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P05_02',2,'AREA06_P05','Masker FKA','Visual',263,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P05_03',3,'AREA06_P05','Sarung tangan PU','Visual',264,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P05_04',4,'AREA06_P05','Celemek','Visual',265,TRUE),

    -- 6. INSP. UV (duplicate proses)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P06',6,'PROSES','INSP. UV','Visual',266,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P06_01',1,'AREA06_P06','Face sheild','Visual',267,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P06_02',2,'AREA06_P06','Masker FKA','Visual',268,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P06_03',3,'AREA06_P06','Sarung tangan PU','Visual',269,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P06_04',4,'AREA06_P06','Celemek','Visual',270,TRUE),

    -- 7. INSPECT & PACKING BATTERY CABLE
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P07',7,'PROSES','INSPECT & PACKING BATTERY CABLE','Visual',271,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P07_01',1,'AREA06_P07','Back support','Visual',272,TRUE),

    -- 8. INSPECT & PACKING BATTERY CABLE (duplicate proses)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P08',8,'PROSES','INSPECT & PACKING BATTERY CABLE','Visual',273,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA06_P08_01',1,'AREA06_P08','Back support','Visual',274,TRUE);


    -- =====================================================
    -- AREA 07 : AREA INSPEKSI FINAL ASSY (QA)
    -- =====================================================

    INSERT INTO ga_checksheet_items
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active)
    VALUES

    -- 1. DRY SURF (VISUAL II)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P01',1,'PROSES','DRY SURF (VISUAL II)','Visual',275,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P01_01',1,'AREA07_P01','Masker kain','Visual',276,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P01_02',2,'AREA07_P01','Sarung tangan PU','Visual',277,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P01_03',3,'AREA07_P01','Celemek','Visual',278,TRUE),

    -- 2. DRY SURF (VISUAL II)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P02',2,'PROSES','DRY SURF (VISUAL II)','Visual',279,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P02_01',1,'AREA07_P02','Masker kain','Visual',280,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P02_02',2,'AREA07_P02','Sarung tangan PU','Visual',281,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P02_03',3,'AREA07_P02','Celemek','Visual',282,TRUE),

    -- 3. DRY SURF (VISUAL II)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P03',3,'PROSES','DRY SURF (VISUAL II)','Visual',283,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P03_01',1,'AREA07_P03','Masker kain','Visual',284,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P03_02',2,'AREA07_P03','Sarung tangan katun','Visual',285,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P03_03',3,'AREA07_P03','Celemek','Visual',286,TRUE),

    -- 4. PACKING
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P04',4,'PROSES','PACKING','Visual',287,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P04_01',1,'AREA07_P04','Back Support','Visual',288,TRUE),

    -- 5. PACKING
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P05',5,'PROSES','PACKING','Visual',289,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P05_01',1,'AREA07_P05','Back Support','Visual',290,TRUE),

    -- 6. PACKING
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P06',6,'PROSES','PACKING','Visual',291,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P06_01',1,'AREA07_P06','Back Support','Visual',292,TRUE),

    -- 7. PACKING
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P07',7,'PROSES','PACKING','Visual',293,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P07_01',1,'AREA07_P07','Back Support','Visual',294,TRUE),

    -- 8. PACKING
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P08',8,'PROSES','PACKING','Visual',295,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P08_01',1,'AREA07_P08','Back Support','Visual',296,TRUE),

    -- 9. WATER PROOF F/A
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P09',9,'PROSES','WATER PROOF F/A','Visual',297,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P09_01',1,'AREA07_P09','Back Support','Visual',298,TRUE),

    -- 10–19. CHECKER (10x)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P10',10,'PROSES','CHECKER','Visual',299,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P10_01',1,'AREA07_P10','Sarung tangan PU','Visual',300,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P11',11,'PROSES','CHECKER','Visual',301,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P11_01',1,'AREA07_P11','Sarung tangan PU','Visual',302,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P12',12,'PROSES','CHECKER','Visual',303,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P12_01',1,'AREA07_P12','Sarung tangan PU','Visual',304,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P13',13,'PROSES','CHECKER','Visual',305,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P13_01',1,'AREA07_P13','Sarung tangan PU','Visual',306,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P14',14,'PROSES','CHECKER','Visual',307,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P14_01',1,'AREA07_P14','Sarung tangan PU','Visual',308,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P15',15,'PROSES','CHECKER','Visual',309,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P15_01',1,'AREA07_P15','Sarung tangan PU','Visual',310,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P16',16,'PROSES','CHECKER','Visual',311,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P16_01',1,'AREA07_P16','Sarung tangan PU','Visual',312,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P17',17,'PROSES','CHECKER','Visual',313,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P17_01',1,'AREA07_P17','Sarung tangan PU','Visual',314,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P18',18,'PROSES','CHECKER','Visual',315,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P18_01',1,'AREA07_P18','Sarung tangan PU','Visual',316,TRUE),

    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P19',19,'PROSES','CHECKER','Visual',317,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA07_P19_01',1,'AREA07_P19','Sarung tangan PU','Visual',318,TRUE);


    -- =====================================================
    -- AREA 08 : AREA WAREHOUSE
    -- =====================================================

    INSERT INTO ga_checksheet_items
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active)
    VALUES

    -- 1. DRIVER + CHARGER BATTERY FORKLIFT
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P01',1,'PROSES','Driver + Charger Battery Forklift','Visual',319,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P01_01',1,'AREA08_P01','Helm','Visual',320,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P01_02',2,'AREA08_P01','Sepatu Safety','Visual',321,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P01_03',3,'AREA08_P01','Back support','Visual',322,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P01_04',4,'AREA08_P01','Safety Vest','Visual',323,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P01_05',5,'AREA08_P01','Masker FKA','Visual',324,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P01_06',6,'AREA08_P01','Sarung Tangan Green Nitril','Visual',325,TRUE),

    -- 2. RECEIVING STORAGE
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P02',2,'PROSES','Receiving Storage','Visual',326,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P02_01',1,'AREA08_P02','Helm','Visual',327,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P02_02',2,'AREA08_P02','Sepatu Safety','Visual',328,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P02_03',3,'AREA08_P02','Back support','Visual',329,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P02_04',4,'AREA08_P02','Safety Vest','Visual',330,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P02_05',5,'AREA08_P02','Masker FKA','Visual',331,TRUE),

    -- 3. CHOROBIKI PRE ASSY (SET 1)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P03',3,'PROSES','Chorobiki Pre Assy','Visual',332,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P03_01',1,'AREA08_P03','Helm','Visual',333,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P03_02',2,'AREA08_P03','Sepatu Safety','Visual',334,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P03_03',3,'AREA08_P03','Back support','Visual',335,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P03_04',4,'AREA08_P03','Sarung tangan PU','Visual',336,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P03_05',5,'AREA08_P03','Safety Vest','Visual',337,TRUE),

    -- 4. CHOROBIKI PRE ASSY (SET 2)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P04',4,'PROSES','Chorobiki Pre Assy','Visual',338,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P04_01',1,'AREA08_P04','Helm','Visual',339,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P04_02',2,'AREA08_P04','Sepatu Safety','Visual',340,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P04_03',3,'AREA08_P04','Back support','Visual',341,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P04_04',4,'AREA08_P04','Sarung tangan Showa BO500','Visual',342,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P04_05',5,'AREA08_P04','Safety Vest','Visual',343,TRUE),

    -- 5. MINISTORE FINAL ASSY / PROTECTOR
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P05',5,'PROSES','Ministore Final Assy / Protector','Visual',344,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P05_01',1,'AREA08_P05','Helm','Visual',345,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P05_02',2,'AREA08_P05','Sepatu Safety','Visual',346,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P05_03',3,'AREA08_P05','Safety Vest','Visual',347,TRUE),

    -- 6. SUPPLY FINAL ASSY / PROTECTOR
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P06',6,'PROSES','Supply Final Assy/ Protector','Visual',348,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA08_P06_01',1,'AREA08_P06','Safety Vest','Visual',349,TRUE);

    -- =====================================================
    -- AREA 09 : AREA EXIM
    -- =====================================================

    INSERT INTO ga_checksheet_items
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active)
    VALUES

    -- 1. DRIVER FORKLIFT / SCANN OUT
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P01',1,'PROSES','Driver Forklift/SCANN OUT','Visual',350,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P01_01',1,'AREA09_P01','Helm','Visual',351,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P01_02',2,'AREA09_P01','Sepatu Safety','Visual',352,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P01_03',3,'AREA09_P01','Back support','Visual',353,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P01_04',4,'AREA09_P01','Safety Vest','Visual',354,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P01_05',5,'AREA09_P01','Masker FKA','Visual',355,TRUE),

    -- 2. PREPARE & SUPPLY KARTON BOX, PALLET / SCANN IN (SET 1)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P02',2,'PROSES','PREPARE & SUPPLY KARTON BOX, PALLET/SCANN IN','Visual',356,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P02_01',1,'AREA09_P02','Helm','Visual',357,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P02_02',2,'AREA09_P02','Safety shoes','Visual',358,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P02_03',3,'AREA09_P02','Back support','Visual',359,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P02_04',4,'AREA09_P02','Masker FKA','Visual',360,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P02_05',5,'AREA09_P02','Safety Vest','Visual',361,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P02_06',6,'AREA09_P02','Sarung tangan PU','Visual',362,TRUE),

    -- 3. PREPARE & SUPPLY KARTON BOX, PALLET / SCANN IN (SET 2)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P03',3,'PROSES','PREPARE & SUPPLY KARTON BOX, PALLET/SCANN IN','Visual',363,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P03_01',1,'AREA09_P03','Helm','Visual',364,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P03_02',2,'AREA09_P03','Safety shoes','Visual',365,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P03_03',3,'AREA09_P03','Back support','Visual',366,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P03_04',4,'AREA09_P03','Masker FKA','Visual',367,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P03_05',5,'AREA09_P03','Safety Vest','Visual',368,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA09_P03_06',6,'AREA09_P03','Sarung tangan PU','Visual',369,TRUE);


    -- =====================================================
    -- AREA 10 : AREA PRE ASSY – APPLICATOR (Produksi)
    -- =====================================================

    INSERT INTO ga_checksheet_items
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active)
    VALUES

    -- 1. PREV. APPLICATOR
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P01',1,'PROSES','Prev. Applicator','Visual',370,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P01_01',1,'AREA10_P01','Masker FKA/3M','Visual',371,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P01_02',2,'AREA10_P01','Sarung tangan katun','Visual',372,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P01_03',3,'AREA10_P01','Sarung tangan hijau','Visual',373,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P01_04',4,'AREA10_P01','Sarung tangan PU','Visual',374,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P01_05',5,'AREA10_P01','Ear Muff/EAR PLUG','Visual',375,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P01_06',6,'AREA10_P01','Kacamata bening','Visual',376,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P01_07',7,'AREA10_P01','Safety shoes','Visual',377,TRUE),

    -- 2. PREV. APPLICATOR
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P02',2,'PROSES','Prev. Applicator','Visual',378,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P02_01',1,'AREA10_P02','Masker FKA/3M','Visual',379,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P02_02',2,'AREA10_P02','Sarung tangan katun','Visual',380,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P02_03',3,'AREA10_P02','Sarung tangan hijau','Visual',381,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P02_04',4,'AREA10_P02','Sarung tangan PU','Visual',382,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P02_05',5,'AREA10_P02','Ear Muff/EAR PLUG','Visual',383,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P02_06',6,'AREA10_P02','Kacamata bening','Visual',384,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P02_07',7,'AREA10_P02','Safety shoes','Visual',385,TRUE),

    -- 3. BACK UP
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P03',3,'PROSES','Back Up','Visual',386,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P03_01',1,'AREA10_P03','Masker FKA','Visual',387,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P03_02',2,'AREA10_P03','Safety shoes','Visual',388,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P03_03',3,'AREA10_P03','Celemek','Visual',389,TRUE),

    -- 4. BACK UP
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P04',4,'PROSES','Back Up','Visual',390,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P04_01',1,'AREA10_P04','Masker FKA','Visual',391,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P04_02',2,'AREA10_P04','Safety shoes','Visual',392,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA10_P04_03',3,'AREA10_P04','Celemek','Visual',393,TRUE);

    -- =====================================================
    -- AREA 11 : AREA WORKSHOP
    -- =====================================================

    INSERT INTO ga_checksheet_items
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active)
    VALUES

    -- 1. LAS, GERINDA, PAINTING, CUT OFF
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01',1,'PROSES','LAS, GERINDA, PAINTING, CUT OFF','Visual',394,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01_01',1,'AREA11_P01','Masker FKA','Visual',395,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01_02',2,'AREA11_P01','Masker respiratory','Visual',396,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01_03',3,'AREA11_P01','Sarung tangan bintil','Visual',397,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01_04',4,'AREA11_P01','Sarung tangan las','Visual',398,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01_05',5,'AREA11_P01','Topeng/kacamata las','Visual',399,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01_06',6,'AREA11_P01','Topeng/kacamata gerinda','Visual',400,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01_07',7,'AREA11_P01','ear muff/ear plug','Visual',401,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01_08',8,'AREA11_P01','Cattlepack','Visual',402,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA11_P01_09',9,'AREA11_P01','Safety shoes','Visual',403,TRUE);

    -- =====================================================
    -- AREA 12 : AREA UTILITY
    -- =====================================================
    INSERT INTO ga_checksheet_items
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active)
    VALUES

    -- 1. PENGECEKAN ARUS LISTRIK (Area Utility)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P01',1,'PROSES','PENGECEKAN ARUS LISTRIK (Area Utility)','Visual',404,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P01_01',1,'AREA12_P01','Kacamata bening','Visual',405,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P01_02',2,'AREA12_P01','Earmuff/earplug','Visual',406,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P01_03',3,'AREA12_P01','Masker FKA','Visual',407,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P01_04',4,'AREA12_P01','Sarung tangan listrik','Visual',408,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P01_05',5,'AREA12_P01','Safety shoes','Visual',409,TRUE),

    -- 2. PENANGANAN TUMPAHAN OLI & SOLAR (Area Utility)
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P02',2,'PROSES','PENANGANAN TUMPAHAN OLI & SOLAR (Area Utility)','Visual',410,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P02_01',1,'AREA12_P02','Pasir','Visual',411,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P02_02',2,'AREA12_P02','Masker kain','Visual',412,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P02_03',3,'AREA12_P02','Sarung tangan bintil','Visual',413,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA12_P02_04',4,'AREA12_P02','Celemek','Visual',414,TRUE);

    -- =====================================================
    -- AREA 13 : AREA RECEIVING INSPECTION MATERIAL
    -- =====================================================
    INSERT INTO ga_checksheet_items
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active)
    VALUES

    -- 1. PENGECEKAN MATERIAL
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA13_P01',1,'PROSES','PENGECEKAN MATERIAL','Visual',415,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA13_P01_01',1,'AREA13_P01','Safety Helmet','Visual',416,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA13_P01_02',2,'AREA13_P01','Safety Vest','Visual',417,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA13_P01_03',3,'AREA13_P01','Back Support','Visual',418,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA13_P01_04',4,'AREA13_P01','Safety shoes','Visual',419,TRUE);

    -- =====================================================
    -- AREA 14 : AREA VOLTAGE TEST
    -- =====================================================
    INSERT INTO ga_checksheet_items
    (type_id, item_key, no, item_group, item_check, method, sort_order, is_active)
    VALUES

    -- 1. PENGECEKAN ARUS LISTRIK
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA14_P01',1,'PROSES','PENGECEKAN ARUS LISTRIK','Visual',420,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA14_P01_01',1,'AREA14_P01','Sarung tangan electric','Visual',421,TRUE),
    ((SELECT id FROM ga_checksheet_types WHERE slug='inspeksi-apd'),'AREA14_P01_02',2,'AREA14_P01','Safety shoes','Visual',422,TRUE);
