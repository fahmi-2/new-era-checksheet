-- Tabel users untuk PostgreSQL
CREATE TABLE users (
  id VARCHAR(100) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  nik VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performa
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_nik ON users(nik);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);

-- Constraint untuk validasi role
ALTER TABLE users ADD CONSTRAINT check_role 
CHECK (role IN ('group-leader-qa', 'inspector-qa', 'admin', 'eso'));

-- Constraint untuk validasi department
ALTER TABLE users ADD CONSTRAINT check_department 
CHECK (department IN ('quality-assurance', 'admin', 'k3'));

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

-- ga_checksheet_types
CREATE TABLE ga_checksheet_types (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ga_checksheet_areas
CREATE TABLE ga_checksheet_areas (
  id SERIAL PRIMARY KEY,
  type_id INTEGER NOT NULL REFERENCES ga_checksheet_types(id),
  no INTEGER NOT NULL,
  name VARCHAR(500) NOT NULL,
  location VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ga_checksheet_items
CREATE TABLE ga_checksheet_items (
  id SERIAL PRIMARY KEY,
  type_id INTEGER NOT NULL REFERENCES ga_checksheet_types(id),
  item_key VARCHAR(100) NOT NULL,
  no INTEGER NOT NULL,
  item_group VARCHAR(255),
  item_check TEXT NOT NULL,
  method VARCHAR(100),
  image VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ga_checksheet_headers
CREATE TABLE ga_checksheet_headers (
  id SERIAL PRIMARY KEY,
  type_id INTEGER NOT NULL REFERENCES ga_checksheet_types(id),
  area_id INTEGER NOT NULL REFERENCES ga_checksheet_areas(id),
  check_date DATE NOT NULL,
  inspector_id VARCHAR(50),
  inspector_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ga_checksheet_details
CREATE TABLE ga_checksheet_details (
  id SERIAL PRIMARY KEY,
  header_id INTEGER NOT NULL REFERENCES ga_checksheet_headers(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES ga_checksheet_items(id),
  result VARCHAR(10),
  finding TEXT,
  corrective_action TEXT,
  pic VARCHAR(255),
  due_date DATE,
  verified_by VARCHAR(255),
  images JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_areas_type ON ga_checksheet_areas(type_id);
CREATE INDEX idx_items_type ON ga_checksheet_items(type_id);
CREATE INDEX idx_headers_type_area ON ga_checksheet_headers(type_id, area_id);
CREATE INDEX idx_headers_date ON ga_checksheet_headers(check_date);
CREATE INDEX idx_details_header ON ga_checksheet_details(header_id);


-- insert ga_checksheet_areas tg-listrik
INSERT INTO ga_checksheet_areas (type_id, no, name, location) 
SELECT id, 1, 'Tangga Listrik A - Produksi', 'Genba A' 
FROM ga_checksheet_types WHERE slug = 'tg-listrik'
UNION ALL
SELECT id, 2, 'Tangga Listrik B - Warehouse', 'Gudang Utama' 
FROM ga_checksheet_types WHERE slug = 'tg-listrik'
UNION ALL
SELECT id, 3, 'Tangga Listrik C - Maintenance', 'Workshop' 
FROM ga_checksheet_types WHERE slug = 'tg-listrik'
UNION ALL
SELECT id, 4, 'Tangga Listrik D - Loading Dock', 'Area Bongkar Muat' 
FROM ga_checksheet_types WHERE slug = 'tg-listrik';
 
-- insert ga_checksheet_items tg-listrik
INSERT INTO ga_checksheet_items 
(type_id, item_key, no, item_group, item_check, method, image, sort_order)
SELECT t.id, v.item_key, v.no, v.item_group, v.item_check, v.method, v.image, v.sort_order
FROM ga_checksheet_types t
JOIN (
    VALUES
    ('sistemPenggerak',1,'Sistem Penggerak','Roda/Ban Masih Layak dan tidak seret dan mudah gerak','Visual & Dicoba','1-sistem_penggerak.jpg',1),
    ('rantaiPenarik',2,'Sistem Hidrolik','Rantai Penarik Hidrolis Tidak putus, Tidak Terlalu Kencang/terlalu kendor','Visual & Dicoba','2.1-sitem_hidrolik1.jpg',2),
    ('kabelHidrolis',3,'Sistem Hidrolik','Kondisi Kabel Hidrolis Tidak lecet','Dicoba','2.2-sitem_hidrolik2.jpg',3),
    ('pelumasanSistem',4,'Sistem Hidrolik','Mudah di putar, masih dalam kondisi pelumasan','Dicoba','3-sitem_hidrolik3.jpg',4),
    ('emergencyBrake',5,'Emergency Brake','Putar ke kiri untuk membuka angin (Emergency Brake)','Dicoba','4-emergency_brake.jpg',5),
    ('rumahLenganPenumpu',6,'Kaki Penumpu (Outrigger)','Rumah Lengan Penumpu','Visual','5-kaki_penunggu1.jpg',6),
    ('lenganPenumpu',7,'Kaki Penumpu (Outrigger)','Lengan-Lengan Penumpu','Visual','6-kaki_penunggu2.jpg',7),
    ('telapakPenumpu',8,'Kaki Penumpu (Outrigger)','Telapak Penumpu','Visual','7-kaki_penunggu3.jpg',8),
    ('pengikatRumahPenumpu',9,'Kaki Penumpu (Outrigger)','Pengikat Rumah Penumpu','Visual & Dicoba','8-kaki_penunggu4.jpg',9),
    ('kunciPengamanPenumpu',10,'Kaki Penumpu (Outrigger)','Kunci Pengaman Penumpu','Visual & Dicoba','9-kaki_penunggu5.jpg',10),
    ('limitSwitchUp',11,'Limit switch UP (Batas Ketinggian Maksimal)','Sensor berfungsi','Dicoba','10-Limit switch UP.jpg',11),
    ('pushButtonNaik',12,'Push button','Push button Naik – Berfungsi saat ditekan','Dicoba','11.1-pb_naik_turun_indic.jpg',12),
    ('emergencyStop',13,'Push button','Emergency Stop – Berfungsi sesuai fungsinya','Dicoba','11.2-emergency_stop.jpg',13),
    ('keranjangKondisi',14,'Kondisi Keranjang','Keranjang tidak berkarat, masih layak & bawah keranjang tidak ada kotoran/sampah','Visual','12-kondisi_keranjang1.jpg',14),
    ('engselKeranjang1',15,'Kondisi Keranjang','Engsel Keranjang tidak seret dan tidak berkarat, baut mur kencang','Visual','13.1-kondisi_keranjang2.jpg',15),
    ('engselKeranjang2',16,'Kondisi Keranjang','Engsel Keranjang tidak seret dan tidak berkarat, baut mur kencang','Visual & Dicoba','13.2-kondisi_keranjang3.jpg',16),
    ('pompaHidrolik',17,'Pompa Hidrolik','Pompa Hidrolik – Tidak bunyi, hidrolik tidak seret dan masih terlumasi, tidak berkarat','Visual','14-pompa_hidrolik.jpg',17),
    ('selangPenghubung',18,'Selang Penghubung','Selang Penghubung – Ada Cover, bersih dan tidak putus','Visual','15-selang_penghubung.jpg',18),
    ('electricalBox',19,'Electrical Box','Electrical Box – Bersih, cat masih bagus, terdapat ID dan kunci','Visual','16-electrical_box.jpg',19),
    ('waterPass',20,'Water Pass','Water Pass – Sesuai level','Visual','17-water_pass.jpg',20)
) AS v(item_key, no, item_group, item_check, method, image, sort_order)
ON TRUE
WHERE t.slug = 'tg-listrik';

-- insert ga_checksheet_areas inspeksi-hydrant
INSERT INTO ga_checksheet_areas (type_id, no, name, location) 
SELECT t.id, v.no, v.name, v.location
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    (1, 'HYDRANT INDOOR 1 • LANTAI 1', 'TIMUR'),
    (2, 'HYDRANT INDOOR 2 • LANTAI 1', 'BARAT'),
    (3, 'HYDRANT INDOOR 3 • LANTAI 2', 'TIMUR'),
    (4, 'HYDRANT INDOOR 4 • LANTAI 2', 'BARAT'),
    (5, 'HYDRANT INDOOR 5 • LANTAI 3', 'TIMUR'),
    (6, 'HYDRANT INDOOR 6 • LANTAI 3', 'BARAT'),
    (7, 'HYDRANT INDOOR 7 • LANTAI 4', 'TIMUR'),
    (8, 'HYDRANT INDOOR 8 • LANTAI 4', 'BARAT'),
    (9, 'HYDRANT INDOOR 9 • LANTAI 5', 'TIMUR'),
    (10, 'HYDRANT INDOOR 10 • LANTAI 5', 'BARAT'),
    (11, 'HYDRANT INDOOR 11 • BASEMENT 1', 'UTARA'),
    (12, 'HYDRANT INDOOR 12 • BASEMENT 1', 'SELATAN'),
    (13, 'HYDRANT INDOOR 13 • BASEMENT 2', 'UTARA'),
    (14, 'HYDRANT INDOOR 14 • BASEMENT 2', 'SELATAN'),
    (15, 'HYDRANT INDOOR 15 • PARKIR TIMUR', 'TIMUR'),
    (16, 'HYDRANT INDOOR 16 • PARKIR BARAT', 'BARAT'),
    (17, 'HYDRANT INDOOR 17 • KANTIN', 'SELATAN'),
    (18, 'HYDRANT INDOOR 18 • RUANG MESIN', 'BARAT'),
    (19, 'HYDRANT INDOOR 19 • RUANG PANEL', 'TIMUR'),
    (20, 'HYDRANT INDOOR 20 • RUANG SERVER', 'UTARA'),
    (21, 'HYDRANT INDOOR 21 • LABORATORIUM', 'SELATAN'),
    (22, 'HYDRANT INDOOR 22 • RUANG PRODUKSI A', 'TIMUR'),
    (23, 'HYDRANT INDOOR 23 • RUANG PRODUKSI B', 'BARAT'),
    (24, 'HYDRANT INDOOR 24 • GUDANG A', 'UTARA'),
    (25, 'HYDRANT INDOOR 25 • GUDANG B', 'SELATAN'),
    (26, 'HYDRANT INDOOR 26 • OFFICE AREA', 'TIMUR'),
    (27, 'HYDRANT PILLAR 1', 'AREA PARKIR DEPAN'),
    (28, 'HYDRANT PILLAR 2', 'AREA PARKIR BELAKANG'),
    (29, 'HYDRANT PILLAR 3', 'JALAN UTAMA TIMUR'),
    (30, 'HYDRANT PILLAR 4', 'JALAN UTAMA BARAT'),
    (31, 'HYDRANT PILLAR 5', 'AREA LOADING DOCK'),
    (32, 'HYDRANT PILLAR 6', 'AREA GUDANG'),
    (33, 'HYDRANT PILLAR 7', 'AREA PRODUKSI'),
    (34, 'HYDRANT INDOOR 34 • RUANG BOILER', 'BARAT'),
    (35, 'HYDRANT INDOOR 35 • RUANG CHILLER', 'TIMUR'),
    (36, 'HYDRANT OUTDOOR 1', 'AREA PERIMETER')
) AS v(no, name, location)
WHERE t.slug = 'inspeksi-hydrant';

-- insert ga_checksheet_items inspeksi-hydrant
INSERT INTO ga_checksheet_items 
(type_id, item_key, no, item_group, item_check, method, image, sort_order)
SELECT t.id, v.item_key, v.no, v.item_group, v.item_check, v.method, v.image, v.sort_order
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    ('item1', 1, 'PILLAR HYDRANT', 'Kondisi fisik pillar hydrant', 'Visual', 'hydrant/pillar-hydrant.png', 1),
    ('item2', 2, 'PILLAR HYDRANT', 'Posisi dan kelurusan pillar', 'Visual', 'hydrant/pillar-hydrant.jpg', 2),
    ('item3', 3, 'BOX HYDRANT', 'Kondisi box hydrant tidak berkarat/rusak', 'Visual', 'hydrant/box-hydrant.jpg', 3),
    ('item4', 4, 'BOX HYDRANT', 'Box dapat dibuka dengan baik', 'Visual', 'hydrant/box-hydrant.jpg', 4),
    ('item5', 5, 'ID HYDRANT', 'Kondisi ID hydrant masih terbaca jelas', 'Visual', 'hydrant/id-hydrant.jpg', 5),
    ('item6', 6, 'ID HYDRANT', 'Posisi ID hydrant mudah terlihat', 'Visual', 'hydrant/box-hydrant.jpg', 6),
    ('item7', 7, 'SAFETY VALVE', 'Safety valve dalam posisi OPEN saat normal', 'Check', 'hydrant/safety-valve-open.jpg', 7),
    ('item8', 8, 'SAFETY VALVE', 'Safety valve dapat berfungsi dengan baik', 'Check', 'hydrant/safety-valve-closed.jpg', 8),
    ('item9', 9, 'SAFETY VALVE', 'Seal valve masih utuh', 'Visual', 'hydrant/seal-valve.jpg', 9),
    ('item10', 10, 'NOZZLE & HANDLE', 'Nozzle dapat diputar dengan baik', 'Check', 'hydrant/nozzle-handle.jpg', 10),
    ('item11', 11, 'NOZZLE & HANDLE', 'Coupling nozzle tidak bocor', 'Check', 'hydrant/coupling-nozzle.jpg', 11),
    ('item12', 12, 'NOZZLE & HANDLE', 'Seal nozzle masih utuh', 'Visual', 'hydrant/seal-nozzle.jpg', 12),
    ('item13', 13, 'VALVE UTAMA', 'Main valve dapat dibuka/ditutup', 'Check', 'hydrant/main-valve.jpg', 13),
    ('item14', 14, 'VALVE A,B', 'Valve A,B dalam posisi CLOSED saat normal', 'Check', 'hydrant/main-valve-closed.jpg', 14),
    ('item15', 15, 'PENUTUP VALVE', 'Penutup valve A/B tidak rusak', 'Check', 'hydrant/valve-cover.jpg', 15),
    ('item16', 16, 'PELUMASAN VALVE', 'Valve terlumasi dengan baik', 'Check', 'hydrant/valve-lubrication.jpg', 16),
    ('item17', 17, 'SELANG HYDRANT', 'Selang hydrant tidak bocor/retak', 'Check', 'hydrant/fire-hose.jpg', 17),
    ('item18', 18, 'LAYOUT', 'Layout hydrant sesuai standar', 'Visual', 'hydrant/layout-hydrant.jpg', 18),
    ('item19', 19, 'INSTALASI PIPA', 'Instalasi pipa air tidak bocor', 'Visual', 'hydrant/pipa-air.jpg', 19),
    ('item20', 20, 'C/S & O/S', 'Label C/S (Close/Stop) & O/S (Open/Start) jelas', 'Visual', 'hydrant/cs-os-label.jpg', 20)
) AS v(item_key, no, item_group, item_check, method, image, sort_order)
WHERE t.slug = 'inspeksi-hydrant';

-- insert ga_checksheet_areas selang-hydrant
INSERT INTO ga_checksheet_areas (type_id, no, name, location) 
SELECT t.id, v.no, v.name, v.location
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    (1, 'PARKIR TIMUR • TIMUR • HYDRANT PILLAR • ANDI', 'TIMUR'),
    (2, 'PARKIR BARAT • BARAT • HYDRANT PILLAR • BUDI', 'BARAT'),
    (3, 'LOADING DOCK • UTARA • HYDRANT PILLAR • CECEP', 'UTARA'),
    (4, 'GUDANG UTAMA • SELATAN • HYDRANT PILLAR • DONI', 'SELATAN'),
    (5, 'AREA PRODUKSI A • TIMUR • HYDRANT INDOOR • EKO', 'TIMUR'),
    (6, 'AREA PRODUKSI B • BARAT • HYDRANT INDOOR • FERI', 'BARAT'),
    (7, 'RUANG MESIN • UTARA • HYDRANT INDOOR • GANI', 'UTARA'),
    (8, 'RUANG BOILER • SELATAN • HYDRANT INDOOR • HADI', 'SELATAN'),
    (9, 'KANTIN • TIMUR • HYDRANT INDOOR • IMAM', 'TIMUR'),
    (10, 'OFFICE AREA • BARAT • HYDRANT INDOOR • JOKO', 'BARAT'),
    (11, 'BASEMENT 1 • UTARA • HYDRANT INDOOR • KARIM', 'UTARA'),
    (12, 'BASEMENT 2 • SELATAN • HYDRANT INDOOR • LUKMAN', 'SELATAN'),
    (13, 'PARKIR DEPAN • TIMUR • HYDRANT PILLAR • MAMAN', 'TIMUR'),
    (14, 'PARKIR BELAKANG • BARAT • HYDRANT PILLAR • NURDIN', 'BARAT'),
    (15, 'JALAN UTAMA TIMUR • UTARA • HYDRANT PILLAR • OTONG', 'UTARA'),
    (16, 'JALAN UTAMA BARAT • SELATAN • HYDRANT PILLAR • PAIJO', 'SELATAN'),
    (17, 'RUANG CHILLER • TIMUR • HYDRANT INDOOR • QODRI', 'TIMUR'),
    (18, 'RUANG PANEL • BARAT • HYDRANT INDOOR • RIZAL', 'BARAT'),
    (19, 'RUANG SERVER • UTARA • HYDRANT INDOOR • SAMSUL', 'UTARA'),
    (20, 'LABORATORIUM • SELATAN • HYDRANT INDOOR • TAUFIK', 'SELATAN')
) AS v(no, name, location)
WHERE t.slug = 'selang-hydrant';

-- insert ga_checksheet_items selang-hydrant
INSERT INTO ga_checksheet_items 
(type_id, item_key, no, item_group, item_check, method, image, sort_order)
SELECT t.id, v.item_key, v.no, v.item_group, v.item_check, v.method, v.image, v.sort_order
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    ('pressureTank', 1, 'Pressure Tank', 'Tekanan pump room sesuai dengan standar (7 kg/cm²)', 'Check Pressure Gauge', 'selang/pressure-tank.jpg', 1),
    ('hasilTekananDgPitot', 2, 'Hasil Tekanan dg Pitot', 'Hasil tekanan sesuai standar titik terjauh min. 4.5 kg/cm²', 'Use Pitot Tube', 'selang/pitot-test.jpg', 2),
    ('tekananEnginePump', 3, 'Tekanan Engine Pump', 'Tekanan engine pump berfungsi normal', 'Check Engine', 'selang/engine-pump.jpg', 3),
    ('fireHose', 4, 'Fire Hose / Selang (2)', 'Tidak bocor / tidak pecah', 'Visual & Test', 'selang/fire-hose-2.jpg', 4),
    ('valve', 5, 'Valve', 'Tidak seret / mudah dibuka', 'Check Operation', 'selang/valve-operation.jpg', 5),
    ('couplingNozzle', 6, 'Coupling Nozzle', 'Pir tidak rusak / bisa normal kembali saat ditekan', 'Check Spring', 'selang/coupling-nozzle.jpg', 6),
    ('couplingHydrant', 7, 'Coupling Hydrant', 'Pir tidak rusak / bisa normal kembali saat ditekan', 'Check Spring', 'selang/coupling-hydrant.jpg', 7),
    ('seal', 8, 'Seal', 'Tidak retak & patah, tidak ada kebocoran', 'Visual Inspection', 'selang/seal-check.jpg', 8)
) AS v(item_key, no, item_group, item_check, method, image, sort_order)
WHERE t.slug = 'selang-hydrant';

-- insert areas inf-jalan
INSERT INTO ga_checksheet_areas (type_id, no, name, location)
SELECT 
    t.id,
    v.no,
    v.name,
    v.location
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    (1, 'Jalan Utama Produksi A • Jalan Utama • Genba A - Main Road', 'Jalan Utama'),
    (2, 'Jalan Utama Produksi B • Jalan Utama • Genba B - Main Road', 'Jalan Utama'),
    (3, 'Jalan Utama Produksi C • Jalan Utama • Genba C - Main Road', 'Jalan Utama'),
    (4, 'Jalan Utama Warehouse • Jalan Utama • Warehouse Area', 'Jalan Utama'),
    (5, 'Jalan Tambahan Genba A • Jalan Tambahan • Genba A - Secondary', 'Jalan Tambahan'),
    (6, 'Jalan Tambahan Genba B • Jalan Tambahan • Genba B - Secondary', 'Jalan Tambahan'),
    (7, 'Trotuar Area Genba A • Trotuar • Genba A - Sidewalk', 'Trotuar'),
    (8, 'Trotuar Area Genba B • Trotuar • Genba B - Sidewalk', 'Trotuar'),
    (9, 'Trotuar Area Genba C • Trotuar • Genba C - Sidewalk', 'Trotuar'),
    (10, 'Boardess Area Produksi A • Boardess • Genba A - Safety Border', 'Boardess'),
    (11, 'Boardess Area Produksi B • Boardess • Genba B - Safety Border', 'Boardess'),
    (12, 'Boardess Area Warehouse • Boardess • Warehouse - Safety Border', 'Boardess'),
    (13, 'Parking Area Roads • Jalan Utama • Parking Zone', 'Jalan Utama'),
    (14, 'Pedestrian Walkway • Trotuar • Main Building', 'Trotuar'),
    (15, 'Loading Dock Area • Jalan Tambahan • Warehouse Loading', 'Jalan Tambahan')
) AS v(no, name, location)
WHERE t.slug = 'inf-jalan';


-- insert items inf-jalan
INSERT INTO ga_checksheet_items
(type_id, item_key, no, item_group, item_check, method, image, sort_order)
SELECT 
    t.id,
    v.item_key,
    v.no,
    v.item_group,
    v.item_check,
    v.method,
    v.image,
    v.sort_order
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    ('jalanRataUtama', 1, NULL, 'Jalan Rata, tidak bergelombang. Tidak rusak, tidak licin dan tidak berpotensi menyebabkan kecelakaan kerja lainnya - JALAN UTAMA :', '', NULL, 1),
    ('jalanRataTambahan', 2, NULL, 'Jalan Rata, tidak bergelombang. Tidak rusak, tidak licin dan tidak berpotensi menyebabkan kecelakaan kerja lainnya - JALAN TAMBAHAN :', '', NULL, 2),
    ('jalanTidakLicin', 3, NULL, 'Jalan Tidak licin/ berlumut', '', NULL, 3),
    ('pencahayaanMemadai', 4, NULL, 'Pencahayaan memadai (cukup terang menyinari area jalan dan sekitarnya)', '', NULL, 4),
    ('trotoarTidakRusak', 5, NULL, 'Trotuar tidak rusak, dan bentuk masih utuh dan sesuai, warna masih bisa terlihat', '', NULL, 5),
    ('boardessTrotuar', 6, NULL, 'Boardess trotuar tidak berkarat, tidak keropos dan visualisasi jelas (Memastikan boardess dengan cara diperiksa jika diperlukan (tidak hanya secara visual) dan dicek kekuatan penyanggannya), (visualisasi sesuai fungsi, berwarna hijau atau kuning hitam sebagai larangan untuk dilewati)', '', NULL, 6),
    ('tidakAdaTumpukan', 7, NULL, 'Tidak ada tumpukan diatas boardess / Boardess cor', '', NULL, 7),
    ('boardessCor', 8, NULL, 'Boardess cor bentukan masih utuh, masih terlihat warnanya dan tidak licin', '', NULL, 8)
) AS v(item_key, no, item_group, item_check, method, image, sort_order)
WHERE t.slug = 'inf-jalan';

--insert areas smoke-detector
INSERT INTO ga_checksheet_areas (type_id, no, name, location) 
SELECT t.id, v.no, v.name, v.location
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    (1, 'LOBBY • Zone 1', 'Zone 1'),
    (2, 'KANTIN • Zone 2', 'Zone 2'),
    (3, 'RUANG RAPAT • Zone 3', 'Zone 3'),
    (4, 'RUANG SERVER • Zone 4', 'Zone 4'),
    (5, 'GUDANG • Zone 5', 'Zone 5'),
    (6, 'RUANG PRODUKSI A • Zone 6', 'Zone 6'),
    (7, 'RUANG PRODUKSI B • Zone 7', 'Zone 7'),
    (8, 'RUANG PRODUKSI C • Zone 8', 'Zone 8'),
    (9, 'RUANG PRODUKSI D • Zone 9', 'Zone 9'),
    (10, 'RUANG PRODUKSI E • Zone 10', 'Zone 10'),
    (11, 'RUANG OFFICE • Zone 11', 'Zone 11'),
    (12, 'RUANG OFFICE 2 • Zone 12', 'Zone 12'),
    (13, 'RUANG OFFICE 3 • Zone 13', 'Zone 13'),
    (14, 'RUANG OFFICE 4 • Zone 14', 'Zone 14'),
    (15, 'RUANG OFFICE 5 • Zone 15', 'Zone 15'),
    (16, 'RUANG OFFICE 6 • Zone 16', 'Zone 16'),
    (17, 'RUANG OFFICE 7 • Zone 17', 'Zone 17'),
    (18, 'RUANG OFFICE 8 • Zone 18', 'Zone 18'),
    (19, 'RUANG OFFICE 9 • Zone 19', 'Zone 19'),
    (20, 'RUANG OFFICE 10 • Zone 20', 'Zone 20')
) AS v(no, name, location)
WHERE t.slug = 'smoke-detector';

-- insert items smoke-detector
INSERT INTO ga_checksheet_items 
(type_id, item_key, no, item_group, item_check, method, image, sort_order)
SELECT t.id, v.item_key, v.no, v.item_group, v.item_check, v.method, v.image, v.sort_order
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    ('alarm_bell', 1, 'Alarm Bell', 'Bunyi alarm bell', 'Test dengan menekan tombol test', 'smoke-detector/alarm-bell.jpg', 1),
    ('indicator_lamp', 2, 'Indicator Lamp', 'Lampu indikator menyala', 'Periksa lampu indikator', 'smoke-detector/indicator-lamp.jpg', 2),
    ('cleanliness', 3, 'Kebersihan', 'Bersih dari debu dan kotoran', 'Periksa kebersihan detector', 'smoke-detector/cleanliness.jpg', 3),
    ('overall_condition', 4, 'Kondisi Fisik', 'Tidak rusak atau berkarat', 'Periksa kondisi fisik casing', 'smoke-detector/overall-condition.jpg', 4)
) AS v(item_key, no, item_group, item_check, method, image, sort_order)
WHERE t.slug = 'smoke-detector';

--insert areas lift-barang
INSERT INTO ga_checksheet_areas (type_id, no, name, location) 
SELECT t.id, v.no, v.name, v.location
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    (1, 'LIFT BARANG PRODUKSI A • Genba A • Produksi Genba A', 'Genba A'),
    (2, 'LIFT BARANG PRODUKSI B • Genba B • Produksi Genba B', 'Genba B'),
    (3, 'LIFT BARANG GUDANG • Warehouse • Gudang Utama', 'Warehouse'),
    (4, 'LIFT BARANG KANTOR • Office • Kantor Pusat', 'Office'),
    (5, 'LIFT BARANG KANTIN • Canteen • Area Kantin', 'Canteen'),
    (6, 'LIFT BARANG PARKIR TIMUR • East Parking • Parkir Timur', 'East Parking'),
    (7, 'LIFT BARANG PARKIR BARAT • West Parking • Parkir Barat', 'West Parking'),
    (8, 'LIFT BARANG LOADING DOCK • Loading Dock • Area Loading', 'Loading Dock'),
    (9, 'LIFT BARANG AREA GUDANG 2 • Warehouse 2 • Gudang 2', 'Warehouse 2'),
    (10, 'LIFT BARANG AREA OFFICE 2 • Office 2 • Kantor Cabang', 'Office 2')
) AS v(no, name, location)
WHERE t.slug = 'lift-barang';

-- insert items lift-barang
INSERT INTO ga_checksheet_items
(type_id, item_key, no, item_group, item_check, method, image, sort_order)
SELECT
    t.id,
    v.item_key,
    v.no,
    v.item_group,
    v.item_check,
    v.method,
    v.image,
    v.sort_order
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    ('doorOperation', 1, 'Door Operation', 'Periksa operasi pintu lift (buka/tutup)', 'Test operation', 'lift-barang/door-operation.jpg', 1),
    ('emergencyStop', 2, 'Emergency Stop', 'Periksa tombol emergency stop', 'Test button', 'lift-barang/emergency-stop.jpg', 2),
    ('alarmBell', 3, 'Alarm Bell', 'Periksa bunyi alarm bell', 'Test alarm', 'lift-barang/alarm-bell.jpg', 3),
    ('lighting', 4, 'Lighting', 'Periksa lampu penerangan dalam lift', 'Visual inspection', 'lift-barang/lighting.jpg', 4),
    ('ventilation', 5, 'Ventilation', 'Periksa sistem ventilasi', 'Check airflow', 'lift-barang/ventilation.jpg', 5),
    ('floorIndicator', 6, 'Floor Indicator', 'Periksa indikator lantai', 'Visual inspection', 'lift-barang/floor-indicator.jpg', 6),
    ('buttonPanel', 7, 'Button Panel', 'Periksa panel tombol lantai', 'Test buttons', 'lift-barang/button-panel.jpg', 7),
    ('handrail', 8, 'Handrail', 'Periksa kondisi handrail', 'Visual inspection', 'lift-barang/handrail.jpg', 8),
    ('floorLeveling', 9, 'Floor Leveling', 'Periksa leveling saat berhenti', 'Test stop', 'lift-barang/floor-leveling.jpg', 9),
    ('emergencyLight', 10, 'Emergency Light', 'Periksa lampu darurat saat mati listrik', 'Test during power off', 'lift-barang/emergency-light.jpg', 10),
    ('communication', 11, 'Communication', 'Periksa sistem komunikasi darurat', 'Test intercom', 'lift-barang/communication.jpg', 11),
    ('overloadAlarm', 12, 'Overload Alarm', 'Periksa alarm overload', 'Test with weight', 'lift-barang/overload-alarm.jpg', 12),
    ('doorSensor', 13, 'Door Sensor', 'Periksa sensor pintu (anti jepit)', 'Test sensor', 'lift-barang/door-sensor.jpg', 13),
    ('cabinCleanliness', 14, 'Cabin Cleanliness', 'Periksa kebersihan kabin', 'Visual inspection', 'lift-barang/cabin-cleanliness.jpg', 14),
    ('emergencyProcedure', 15, 'Emergency Procedure', 'Periksa poster prosedur darurat', 'Visual inspection', 'lift-barang/emergency-procedure.jpg', 15),
    ('machineRoom', 16, 'Machine Room', 'Periksa kondisi ruang mesin (jika ada)', 'Visual inspection', 'lift-barang/machine-room.jpg', 16),
    ('guideRail', 17, 'Guide Rail', 'Periksa kondisi rel panduan', 'Visual inspection', 'lift-barang/guide-rail.jpg', 17),
    ('counterweight', 18, 'Counterweight', 'Periksa sistem counterweight', 'Visual inspection', 'lift-barang/counterweight.jpg', 18),
    ('cableCondition', 19, 'Cable Condition', 'Periksa kondisi kabel lift', 'Visual inspection', 'lift-barang/cable-condition.jpg', 19),
    ('safetyGear', 20, 'Safety Gear', 'Periksa sistem safety gear', 'Test safety', 'lift-barang/safety-gear.jpg', 20)
) AS v(
    item_key,
    no,
    item_group,
    item_check,
    method,
    image,
    sort_order
)
WHERE t.slug = 'lift-barang';

--insert areas inspeksi-apd
-- STEP 2: Insert Areas
INSERT INTO ga_checksheet_areas (type_id, no, name, location, is_active) VALUES
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 1, 'PRE ASSY AREA GENBA C (Produksi) ○ Produksi', 'Produksi', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 2, 'PRE ASSY GENBA A+B (Produksi) ○ Produksi', 'Produksi', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 3, 'AREA FINAL ASSY (Produksi) ○ Produksi', 'Produksi', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 4, 'AREA CUTTING TUBE (Produksi) ○ Produksi', 'Produksi', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 5, 'INSPEKSI PRE ASSY AREA GENBA C (QA) ○ QA', 'QA', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 6, 'INSPEKSI PRE ASSY GENBA A+B (QA) ○ QA', 'QA', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 7, 'AREA INSPEKSI FINAL ASSY (QA) ○ QA', 'QA', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 8, 'AREA WAREHOUSE ○ Gudang', 'Gudang', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 9, 'AREA EXIM ○ Gudang', 'Gudang', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 10, 'AREA APPLICATOR ○ Applicator', 'Applicator', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 11, 'AREA WORKSHOP ○ Maintenance', 'Maintenance', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 12, 'AREA UTILITY ○ Utilitas', 'Utilitas', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 13, 'AREA RECEIVING INSPECTION MATERIAL ○ Logistik', 'Logistik', TRUE),
((SELECT id FROM ga_checksheet_types WHERE slug = 'inspeksi-apd'), 14, 'AREA VOLTAGE TEST ○ Produksi', 'Produksi', TRUE);

--insert items inspeksi-apd
INSERT INTO ga_checksheet_items
(type_id, item_key, no, item_group, item_check, method, image, sort_order)
SELECT
    t.id,
    v.item_key,
    v.no,
    v.item_group,
    v.item_check,
    v.method,
    v.image,
    v.sort_order
FROM ga_checksheet_types t
CROSS JOIN (
    VALUES
    -- PROSES ITEMS (Group)
    ('proses_produksi', 1, 'PROSES', 'Proses Produksi', 'Visual Inspection', 'apd/produksi.jpg', 1),
    ('proses_qc', 2, 'PROSES', 'Proses Quality Control', 'Visual Inspection', 'apd/qc.jpg', 2),
    ('proses_gudang', 3, 'PROSES', 'Proses Gudang', 'Visual Inspection', 'apd/gudang.jpg', 3),
    ('proses_logistik', 4, 'PROSES', 'Proses Logistik', 'Visual Inspection', 'apd/logistik.jpg', 4),
    ('proses_maintenance', 5, 'PROSES', 'Proses Maintenance', 'Visual Inspection', 'apd/maintenance.jpg', 5),
    ('proses_utilitas', 6, 'PROSES', 'Proses Utilitas', 'Visual Inspection', 'apd/utilitas.jpg', 6),

    -- APD ITEMS untuk PRODUKSI
    ('apd_produksi_helm', 7, 'proses_produksi', 'Helm Safety', 'Check Condition', 'apd/helm.jpg', 7),
    ('apd_produksi_kacamata', 8, 'proses_produksi', 'Kacamata Safety', 'Check Condition', 'apd/kacamata.jpg', 8),
    ('apd_produksi_masker', 9, 'proses_produksi', 'Masker', 'Check Condition', 'apd/masker.jpg', 9),
    ('apd_produksi_sarung_tangan', 10, 'proses_produksi', 'Sarung Tangan', 'Check Condition', 'apd/sarung-tangan.jpg', 10),
    ('apd_produksi_sepatu', 11, 'proses_produksi', 'Sepatu Safety', 'Check Condition', 'apd/sepatu.jpg', 11),
    ('apd_produksi_rompi', 12, 'proses_produksi', 'Rompi Reflektor', 'Check Condition', 'apd/rompi.jpg', 12),

    -- APD ITEMS untuk QC
    ('apd_qc_helm', 13, 'proses_qc', 'Helm Safety', 'Check Condition', 'apd/helm.jpg', 13),
    ('apd_qc_kacamata', 14, 'proses_qc', 'Kacamata Safety', 'Check Condition', 'apd/kacamata.jpg', 14),
    ('apd_qc_masker', 15, 'proses_qc', 'Masker', 'Check Condition', 'apd/masker.jpg', 15),
    ('apd_qc_sarung_tangan', 16, 'proses_qc', 'Sarung Tangan', 'Check Condition', 'apd/sarung-tangan.jpg', 16),
    ('apd_qc_sepatu', 17, 'proses_qc', 'Sepatu Safety', 'Check Condition', 'apd/sepatu.jpg', 17),
    ('apd_qc_rompi', 18, 'proses_qc', 'Rompi Reflektor', 'Check Condition', 'apd/rompi.jpg', 18),

    -- APD ITEMS untuk GUDANG
    ('apd_gudang_helm', 19, 'proses_gudang', 'Helm Safety', 'Check Condition', 'apd/helm.jpg', 19),
    ('apd_gudang_kacamata', 20, 'proses_gudang', 'Kacamata Safety', 'Check Condition', 'apd/kacamata.jpg', 20),
    ('apd_gudang_masker', 21, 'proses_gudang', 'Masker', 'Check Condition', 'apd/masker.jpg', 21),
    ('apd_gudang_sarung_tangan', 22, 'proses_gudang', 'Sarung Tangan', 'Check Condition', 'apd/sarung-tangan.jpg', 22),
    ('apd_gudang_sepatu', 23, 'proses_gudang', 'Sepatu Safety', 'Check Condition', 'apd/sepatu.jpg', 23),
    ('apd_gudang_rompi', 24, 'proses_gudang', 'Rompi Reflektor', 'Check Condition', 'apd/rompi.jpg', 24)
) AS v(
    item_key,
    no,
    item_group,
    item_check,
    method,
    image,
    sort_order
)
WHERE t.slug = 'inspeksi-apd';

