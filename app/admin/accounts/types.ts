export interface User {
  id: string;
  username: string;
  fullName: string;
  nik: string;
  department: string;
  role: string;
  isActive: boolean;
  checksheets: string[];
  createdAt: string;
  lastLogin: string | null;
  totalLogins: number;
}

export const VALID_CHECKSHEETS = [
  { key: "hydrant", label: "Hydrant" },
  { key: "selang-hydrant", label: "Selang Hydrant" },
  { key: "fire-alarm", label: "Fire Alarm" },
  { key: "smoke-detector", label: "Smoke Detector" },
  { key: "apar", label: "APAR" },
  { key: "emergency-lamp", label: "Emergency Lamp" },
  { key: "exit-lamp-pintu-darurat", label: "Exit Lamp & Pintu Darurat" },
  { key: "lift-barang", label: "Lift Barang" },
  { key: "inspeksi-preventif-lift-barang", label: "Inspeksi Preventif Lift Barang" },
  { key: "tg-listrik", label: "Tangga Listrik" },
  { key: "panel", label: "Panel Listrik" },
  { key: "form-inspeksi-stop-kontak", label: "Stop Kontak" },
  { key: "e-checksheet-apd", label: "APD" },
  { key: "inf-jalan", label: "Infrastruktur Jalan" },
  { key: "inspeksi-apd", label: "Inspeksi APD" },
  { key: "checksheet-toilet", label: "Toilet" },
];
