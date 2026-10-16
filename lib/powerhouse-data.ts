// lib/powerhouse-data.ts

export interface PowerHouseCheckpoint {
  no: number;
  point: string;
  standard: string;
  method: string;
  sample: string;
}

export interface PowerHouseUnit {
  id: string;
  no: number;
  name: string;
  category: "Genset & Bahan Bakar" | "Trafo & Panel Listrik" | "Compressor & Air Dryer" | "Pumping System & Tangki";
  icon: string;
  capacity?: string;
  checkpoints: PowerHouseCheckpoint[];
}

export const POWER_HOUSE_UNITS: PowerHouseUnit[] = [
  {
    id: "storage-tank",
    no: 1,
    name: "Storage Tank",
    category: "Pumping System & Tangki",
    icon: "🛢️",
    capacity: "Daily PM",
    checkpoints: [
      { no: 1, point: "Check kebocoran udara", standard: "Tidak ada kebocoran", method: "Visual & Dengar", sample: "OK" },
      { no: 2, point: "Air press tank", standard: "5 - 11.5 kg/cm²", method: "Visual Pressure Gauge", sample: "7 Bar" },
      { no: 3, point: "Kebersihan Tangki", standard: "Tidak ada benda asing / bersih", method: "Visual", sample: "OK" },
      { no: 4, point: "Saluran Air Kondensasi", standard: "Berfungsi normal & lancar", method: "Visual & Uji Drain", sample: "OK" }
    ]
  },
  {
    id: "warming-up-genset",
    no: 2,
    name: "Warming Up Genset",
    category: "Genset & Bahan Bakar",
    icon: "⏱️",
    capacity: "Utility Routine",
    checkpoints: [
      { no: 1, point: "Jam Start Warming Up Genset", standard: "Sesuai Jadwal Rutin Operasional", method: "Pencatatan Jam", sample: "08:00" },
      { no: 2, point: "Tegangan / Voltage Output Genset", standard: "380V - 400V (Stabil)", method: "Visual Meter Display", sample: "395V" },
      { no: 3, point: "Frekuensi Output Genset", standard: "50 Hz", method: "Visual Frekuensi Meter", sample: "50 Hz" },
      { no: 4, point: "Tekanan Oli / Oil Pressure", standard: "3 - 5 Bar", method: "Visual Oil Gauge", sample: "4 Bar" },
      { no: 5, point: "Temperatur Air Radiator", standard: "75°C - 90°C", method: "Visual Temperature Gauge", sample: "80°C" },
      { no: 6, point: "Kondisi Suara & Getaran Mesin", standard: "Halus, tidak ada suara abnormal", method: "Sensori & Auditori", sample: "OK" }
    ]
  },
  {
    id: "tangki-solar",
    no: 3,
    name: "Tangki Solar",
    category: "Genset & Bahan Bakar",
    icon: "⛽",
    capacity: "Level Solar Liter",
    checkpoints: [
      { no: 1, point: "Tangki solar", standard: "Tidak Bocor", method: "Visual dan dicoba", sample: "OK" },
      { no: 2, point: "Leveling Solar", standard: "Mudah Terlihat & Cukup", method: "Visual dan dicoba", sample: "OK" },
      { no: 3, point: "Motor Pompa Solar", standard: "Tidak Bocor & Berfungsi", method: "Visual dan dicoba", sample: "OK" },
      { no: 4, point: "Pompa Solar", standard: "Normal (berputar stabil)", method: "Visual dan dicoba", sample: "OK" },
      { no: 5, point: "Pipa Saluran", standard: "Tidak Bocor / Rembes", method: "Visual", sample: "OK" },
      { no: 6, point: "Tombol ON - OFF", standard: "Berfungsi dengan baik", method: "Visual dan dicoba", sample: "OK" }
    ]
  },
  {
    id: "genset-generating-set",
    no: 4,
    name: "Generating Set (GENSET)",
    category: "Genset & Bahan Bakar",
    icon: "🔋",
    capacity: "Power House Main",
    checkpoints: [
      { no: 1, point: "Temperatur Ruangan", standard: "Max 40°C", method: "Visual Termometer", sample: "38°C" },
      { no: 2, point: "Air Accu", standard: "Indicator Warna Hijau", method: "Visual Indikator", sample: "Hijau" },
      { no: 3, point: "Air Radiator", standard: "Antara UP dan LOW level", method: "Visual", sample: "OK" },
      { no: 4, point: "Oli Mesin", standard: "Antara UP dan LOW level dipstick", method: "Visual Dipstick", sample: "OK" },
      { no: 5, point: "Cek Kebocoran Oli Mesin", standard: "Tidak ada bocor", method: "Visual", sample: "OK" },
      { no: 6, point: "Cek Kebocoran Filter Solar", standard: "Tidak ada bocor", method: "Visual", sample: "OK" }
    ]
  },
  {
    id: "main-panel",
    no: 5,
    name: "Main Panel Power House",
    category: "Trafo & Panel Listrik",
    icon: "⚡",
    capacity: "Main ACB & Capacitor",
    checkpoints: [
      { no: 1, point: "Temperatur Ruangan", standard: "Max 40°C", method: "Visual Termometer", sample: "38°C" },
      { no: 2, point: "Power Factor (Capacitor)", standard: "0.80 - 0.99 (Otomatis)", method: "Visual Display", sample: "0.95" },
      { no: 3, point: "Arus (Main ACB fase R)", standard: "Sesuai Beban / 950 A / 486 A", method: "Visual Ampere Meter", sample: "650 A" },
      { no: 4, point: "Arus (Main ACB fase S)", standard: "Sesuai Beban / 950 A / 486 A", method: "Visual Ampere Meter", sample: "650 A" },
      { no: 5, point: "Arus (Main ACB fase T)", standard: "Sesuai Beban / 950 A / 486 A", method: "Visual Ampere Meter", sample: "650 A" },
      { no: 6, point: "Frekuensi (Main ACB)", standard: "50 Hz", method: "Visual Frekuensi Meter", sample: "50 Hz" }
    ]
  },
  {
    id: "trafo-transformer",
    no: 6,
    name: "Travo (Main Transformer)",
    category: "Trafo & Panel Listrik",
    icon: "🔌",
    capacity: "Main Distribution kVA",
    checkpoints: [
      { no: 1, point: "Temperatur Ruangan", standard: "Max 40°C", method: "Visual Termometer", sample: "38°C" },
      { no: 2, point: "Posisi Pelampung Besar", standard: "Posisi Atas (Normal)", method: "Visual", sample: "OK" },
      { no: 3, point: "Posisi Pelampung Kecil", standard: "Posisi Atas (Normal)", method: "Visual", sample: "OK" },
      { no: 4, point: "Lampu Indikator Incoming R", standard: "ON (Menyala)", method: "Visual", sample: "OK" },
      { no: 5, point: "Lampu Indikator Incoming S", standard: "ON (Menyala)", method: "Visual", sample: "OK" },
      { no: 6, point: "Lampu Indikator Incoming T", standard: "ON (Menyala)", method: "Visual", sample: "OK" }
    ]
  },
  {
    id: "air-dryer-arx90hl",
    no: 7,
    name: "Air Dryer ARX90HL (ORION)",
    category: "Compressor & Air Dryer",
    icon: "💨",
    capacity: "Type ARX90HL",
    checkpoints: [
      { no: 1, point: "Unit Air Dryer", standard: "Tidak ada suara abnormal, bersih tidak berdebu", method: "Visual & Sensori", sample: "OK" },
      { no: 2, point: "Tombol ON dan OFF", standard: "Normal bisa digunakan", method: "Fungsional", sample: "OK" },
      { no: 3, point: "Lampu Indikator ON", standard: "Lampu menyala", method: "Visual", sample: "OK" },
      { no: 4, point: "Air Pressure", standard: "0.5 - 0.7 MPa", method: "Visual Pressure Gauge", sample: "0.65 MPa" },
      { no: 5, point: "EVAP Pressure", standard: "0.7 - 1.15 MPa", method: "Visual Evap Gauge", sample: "0.85 MPa" }
    ]
  },
  {
    id: "air-dryer-fx14",
    no: 8,
    name: "Air Dryer FX14",
    category: "Compressor & Air Dryer",
    icon: "❄️",
    capacity: "Type FX14",
    checkpoints: [
      { no: 1, point: "Check Indikator Filter Udara", standard: "H = Hijau (Bagus) / K = Kuning", method: "Visual", sample: "H (Hijau)" },
      { no: 2, point: "Buang Air dari Valve Manual", standard: "Lancar mengalir", method: "Manual Drain Check", sample: "OK" },
      { no: 3, point: "Suhu pada Temperatur", standard: "Sesuai Standar Operasional Max", method: "Visual Display", sample: "20°C" },
      { no: 4, point: "Extra Fan", standard: "Berputar Normal", method: "Visual", sample: "OK" },
      { no: 5, point: "Kebersihan Unit Dryer", standard: "Bersih bebas kotoran/debu", method: "Visual", sample: "OK" }
    ]
  },
  {
    id: "booster-pump",
    no: 9,
    name: "Booster Pump (Fire Hydrant)",
    category: "Pumping System & Tangki",
    icon: "🚒",
    capacity: "Hydrant Booster Unit",
    checkpoints: [
      { no: 1, point: "Motor Pump 1", standard: "On Running (suara normal, pompa & kopling tidak bocor)", method: "Visual dan dicoba", sample: "OK" },
      { no: 2, point: "Motor Pump 2", standard: "On Running (suara normal, pompa & kopling tidak bocor)", method: "Visual dan dicoba", sample: "OK" },
      { no: 3, point: "Motor Pump 3", standard: "On Running (suara normal, pompa & kopling tidak bocor)", method: "Visual dan dicoba", sample: "OK" },
      { no: 4, point: "Nilai Pressure Gauge (Utama)", standard: "Sesuai Standard Tekanan Hydrant", method: "Visual Gauge", sample: "3 Bar" },
      { no: 5, point: "Panel Booster Pump", standard: "Fan, fungsi indikator dan kebersihan", method: "Visual & dicoba", sample: "OK" },
      { no: 6, point: "Kebersihan Booster Pump (All)", standard: "Tidak banyak karat / terawat", method: "Visual", sample: "OK" },
      { no: 7, point: "Booster Pump yang Beroperasi", standard: "2 pompa siap siaga", method: "Visual", sample: "2 Pompa" },
      { no: 8, point: "Kebersihan Ruangan", standard: "Tidak kotor, standar 5S", method: "Visual", sample: "OK" }
    ]
  },
  {
    id: "kontaktor-compressor",
    no: 10,
    name: "Kontaktor Compressor",
    category: "Compressor & Air Dryer",
    icon: "🎛️",
    capacity: "K21, K22, K23 & Motor Screw",
    checkpoints: [
      { no: 1, point: "Contactor K21", standard: "Max 85°C", method: "Visual Thermal", sample: "70°C" },
      { no: 2, point: "Overload F21", standard: "Max 85°C", method: "Visual Thermal", sample: "70°C" },
      { no: 3, point: "Contactor K23", standard: "Max 85°C", method: "Visual Thermal", sample: "70°C" },
      { no: 4, point: "Contactor K22", standard: "Max 85°C", method: "Visual Thermal", sample: "70°C" },
      { no: 5, point: "AMPERE MOTOR SCREW", standard: "U = Sesuai Beban / 70 A", method: "AVO / Clamp Meter", sample: "70 A" },
      { no: 6, point: "AMPERE FAN BLOWER", standard: "U = Sesuai Beban / 5 A", method: "AVO / Clamp Meter", sample: "5 A" }
    ]
  },
  {
    id: "compressor-fix-3",
    no: 11,
    name: "Compressor Fix 3",
    category: "Compressor & Air Dryer",
    icon: "⚙️",
    capacity: "Type GA55 Fix",
    checkpoints: [
      { no: 1, point: "Temperatur Ruangan", standard: "Max 40°C", method: "Visual Termometer", sample: "38°C" },
      { no: 2, point: "Check Level Oli Comp.", standard: "Max / Orange Level", method: "Visual Level Glass", sample: "OK" },
      { no: 3, point: "Check Kebocoran Oli", standard: "Tidak ada kebocoran", method: "Visual", sample: "OK" },
      { no: 4, point: "Buang Air dari Valve Manual", standard: "Lancar mengalir", method: "Visual & dicoba", sample: "OK" },
      { no: 5, point: "Valve dan Hose Manual Drain", standard: "Tidak bocor", method: "Visual & dicoba", sample: "OK" },
      { no: 6, point: "Suhu Compressor Saat Itu", standard: "Max 110°C", method: "Visual Modul", sample: "83°C" },
      { no: 7, point: "Running Hours", standard: "Cek Actual Modul Digital", method: "Visual Modul", sample: "9999 Hr" },
      { no: 8, point: "Indicator Filter Udara", standard: "Max = 100%, Min = 20%", method: "Visual Modul", sample: "70%" },
      { no: 9, point: "DP Oil Separator", standard: "Max 0.8", method: "Visual Modul", sample: "0.2" },
      { no: 10, point: "Filter Fan In dan Out", standard: "Tidak kotor", method: "Dilepas & dicek", sample: "OK" },
      { no: 11, point: "Kebersihan Ruangan", standard: "Bersih tidak kotor", method: "Visual", sample: "OK" }
    ]
  },
  {
    id: "compressor-thermal",
    no: 12,
    name: "Compressor Thermal & Epcos",
    category: "Compressor & Air Dryer",
    icon: "🌡️",
    capacity: "Epcos Filter & Inverter Cable",
    checkpoints: [
      { no: 1, point: "IN EPCOS (Filter Cable)", standard: "50.0°C ~ 60.0°C (Max 72°C)", method: "Thermal Gun / Visual", sample: "52.0°C" },
      { no: 2, point: "OUT FAN RADIAL (Cable)", standard: "50.0°C ~ 60.0°C (Max 72°C)", method: "Thermal Gun / Visual", sample: "52.0°C" },
      { no: 3, point: "IN INVERTER (Cable)", standard: "50.0°C ~ 60.0°C (Max 72°C)", method: "Thermal Gun / Visual", sample: "52.0°C" },
      { no: 4, point: "OUT INVERTER (Cable)", standard: "50.0°C ~ 60.0°C (Max 72°C)", method: "Thermal Gun / Visual", sample: "52.0°C" },
      { no: 5, point: "CONTACTOR FAN RADIAL (Cable)", standard: "50.0°C ~ 60.0°C (Max 72°C)", method: "Thermal Gun / Visual", sample: "52.0°C" },
      { no: 6, point: "Cooling Fan Inverter", standard: "Berputar lancar, tidak kotor", method: "Visual", sample: "OK" }
    ]
  },
  {
    id: "compressor-vsd",
    no: 13,
    name: "Compressor VSD (1, 4, 5)",
    category: "Compressor & Air Dryer",
    icon: "🔄",
    capacity: "Type GA55 VSD",
    checkpoints: [
      { no: 1, point: "Temperatur Ruangan", standard: "Max 40°C", method: "Visual Termometer", sample: "38°C" },
      { no: 2, point: "Check Level Oli Comp.", standard: "Max / Orange Level", method: "Visual Level Glass", sample: "OK" },
      { no: 3, point: "Check Kebocoran Oli", standard: "Tidak ada kebocoran", method: "Visual", sample: "OK" },
      { no: 4, point: "Buang Air dari Valve Manual", standard: "Lancar mengalir", method: "Visual & dicoba", sample: "OK" },
      { no: 5, point: "Valve dan Hose Manual Drain", standard: "Tidak bocor", method: "Visual & dicoba", sample: "OK" },
      { no: 6, point: "Suhu Compressor Saat Itu", standard: "Max 110°C", method: "Visual Modul", sample: "83°C" },
      { no: 7, point: "Running Hours", standard: "Cek Actual Modul Digital", method: "Visual Modul", sample: "9999 Hr" },
      { no: 8, point: "Indicator Filter Udara", standard: "Max = 50%, Min = 20%", method: "Visual Modul", sample: "40%" },
      { no: 9, point: "DP Oil Separator", standard: "Max 0.8", method: "Visual Modul", sample: "0.2" },
      { no: 10, point: "Filter Fan In dan Out (VSD)", standard: "Tidak kotor", method: "Dilepas & dicek", sample: "OK" },
      { no: 11, point: "Kebersihan Ruangan", standard: "Bersih tidak kotor", method: "Visual", sample: "OK" }
    ]
  }
];
