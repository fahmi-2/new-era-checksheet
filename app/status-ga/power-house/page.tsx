"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Zap, Wind, Flame, Shield, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
    Save, Trash2, Edit3, X, ChevronDown, RefreshCw, Info, ClipboardList, History,
    Loader2, MapPin, Clock, Wand2, Search, FileCheck2, Check, Activity,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { useConnection } from "@/lib/connection-context";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type ToggleValue = "O" | "X" | "";
type InputType = "number" | "toggle" | "dropdown" | "time" | "text";

interface CheckItem {
    id: string;
    label: string;
    type: InputType;
    options?: string[];
    unit?: string;
    ngRule?: (val: string | number) => boolean;
    placeholder?: string;
    helperText?: string;
}

interface EquipmentSheet {
    id: string;
    name: string;
    items: CheckItem[];
}

interface SystemGroup {
    id: string;
    name: string;
    shortName: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    equipment: EquipmentSheet[];
}

interface FormValues {
    [equipId: string]: {
        [itemId: string]: string | undefined;
        catatan?: string;
    };
}

interface NGItem {
    equipId: string;
    itemId: string;
    label: string;
}

interface InspectionSession {
    id: string;
    tgl: string;
    shift: string;
    pic: string;
    values: FormValues;
    ngItems: NGItem[];
    scorePercent: number;
    createdAt: string;
    editedAt?: string;
    equipName?: string; // Menandakan bahwa sesi ini khusus untuk satu alat
}

// ─── MASTER DATA ─────────────────────────────────────────────────────────────

const SYSTEM_GROUPS: SystemGroup[] = [
    {
        id: "GEN_FUEL",
        name: "Sistem Generator & Bahan Bakar",
        shortName: "Genset & Fuel",
        icon: <Zap size={20} />,
        color: "#b45309",
        bgColor: "#fffbeb",
        borderColor: "#fbbf24",
        equipment: [
            {
                id: "GENSET-01",
                name: "Genset",
                items: [
                    { id: "tempRuang", label: "Temperatur Ruangan", type: "number", unit: "°C", ngRule: (v) => Number(v) > 40, helperText: "Standar: ≤ 40°C" },
                    { id: "airRadiator", label: "Air Radiator", type: "dropdown", options: ["Normal", "NG"], ngRule: (v) => v === "NG", helperText: "Normal = batas atas, NG = batas bawah" },
                    { id: "bocorFilterSolar", label: "Kebocoran Filter Solar", type: "toggle", helperText: "O = Tidak bocor, X = Bocor (NG)" },
                    { id: "vbeltAlternator", label: "V-Belt Alternator", type: "toggle", helperText: "O = Kencang/Bagus, X = Aus/Kendor (NG)" },
                    { id: "vbeltUtama", label: "V-Belt Utama", type: "toggle", helperText: "O = Kencang/Bagus, X = Aus/Kendor (NG)" },
                    { id: "runningHours", label: "Unit Running Hour", type: "number", unit: "jam", placeholder: "Baca hour meter", helperText: "Pastikan sinkron dengan jam kerja aktual" },
                    { id: "kebersihanGenset", label: "Kebersihan Unit Genset", type: "toggle", helperText: "O = Bersih, X = Kotor (NG)" },
                    { id: "kebersihanRuangan", label: "Kebersihan Ruangan (Power House)", type: "toggle", helperText: "O = Bersih, X = Kotor (NG)" },
                ],
            },
            {
                id: "AKI-OLI-GENSET",
                name: "Aki & Oli Genset",
                items: [
                    { id: "airAccu", label: "Air Accu", type: "dropdown", options: ["Hijau", "Kuning", "Merah", "N/A"], ngRule: (v) => v !== "Hijau" && v !== "N/A", helperText: "Hijau = OK, N/A = Not Applicable" },
                    { id: "oliMesin", label: "Oli Mesin", type: "dropdown", options: ["Normal", "NG"], ngRule: (v) => v === "NG", helperText: "Normal = batas atas, NG = batas bawah" },
                    { id: "bocorOliMesin", label: "Kebocoran Oli Mesin", type: "toggle", helperText: "O = Tidak bocor, X = Bocor (NG)" },
                    { id: "markingPullAccu", label: "Marking Pull Accu", type: "toggle", helperText: "O = Tanda lurus & kencang, X = Geser/Kendor (NG)" },
                    { id: "insulasiKabelAki", label: "Insulasi Kabel Aki", type: "toggle", helperText: "O = Mulus, X = Rusak/Gores (NG)" },
                    { id: "suhuKabelAki", label: "Suhu Kabel Aki", type: "number", unit: "°C", ngRule: (v) => Number(v) > 31 || Number(v) < 29, helperText: "Standar: 29–31°C" },
                    { id: "suhuPullAki", label: "Suhu Pull Aki", type: "number", unit: "°C", ngRule: (v) => Number(v) > 31 || Number(v) < 29, helperText: "Standar: 29–31°C" },
                    { id: "voltAki1", label: "Voltase Aki 1", type: "number", unit: "V", ngRule: (v) => Number(v) < 12.0, helperText: "Standar: ≥ 12.0 V" },
                    { id: "voltAki2", label: "Voltase Aki 2", type: "number", unit: "V", ngRule: (v) => Number(v) < 12.0, helperText: "Standar: ≥ 12.0 V" },
                ],
            },
            {
                id: "TANGKI-SOLAR",
                name: "Tangki Solar Harian",
                items: [
                    { id: "tangkiSolar", label: "Kondisi Tangki Solar", type: "toggle", helperText: "O = Tidak bocor" },
                    { id: "levelingSolar", label: "Leveling Solar", type: "toggle", helperText: "O = Mudah terlihat" },
                    { id: "motorPompaSolar", label: "Motor Pompa Solar", type: "toggle", helperText: "O = Tidak bocor" },
                    { id: "pompaSolar", label: "Pompa Solar", type: "toggle", helperText: "O = Berputar normal" },
                    { id: "pipaSaluran", label: "Pipa Saluran", type: "toggle", helperText: "O = Tidak bocor" },
                    { id: "tombolOnOff", label: "Tombol ON/OFF", type: "toggle", helperText: "O = Berfungsi normal" },
                    { id: "volumeSolar", label: "Volume Solar", type: "number", unit: "Liter", ngRule: (v) => Number(v) <= 3000, helperText: "Standar: > 3000 Liter" },
                ],
            },
        ],
    },
    {
        id: "DIST_LISTRIK",
        name: "Sistem Distribusi Listrik TM & TR",
        shortName: "Panel & Trafo",
        icon: <Zap size={20} />,
        color: "#1d4ed8",
        bgColor: "#eff6ff",
        borderColor: "#93c5fd",
        equipment: [
            {
                id: "MAIN-PANEL",
                name: "Main Panel Distribusi ACB",
                items: [
                    { id: "tempRuang", label: "Temperatur Ruangan", type: "number", unit: "°C", ngRule: (v) => Number(v) > 40, helperText: "Maks: 40°C" },
                    { id: "powerFactor", label: "Power Factor", type: "number", ngRule: (v) => Number(v) < 0.80, helperText: "Standar: 0.80–0.99" },
                    { id: "arusR", label: "Arus R", type: "number", unit: "A", ngRule: (v) => Number(v) > 950, helperText: "Maks: 950 A" },
                    { id: "arusS", label: "Arus S", type: "number", unit: "A", ngRule: (v) => Number(v) > 950, helperText: "Maks: 950 A" },
                    { id: "arusT", label: "Arus T", type: "number", unit: "A", ngRule: (v) => Number(v) > 950, helperText: "Maks: 950 A" },
                    { id: "frekuensi", label: "Frekuensi", type: "number", unit: "Hz", ngRule: (v) => Math.abs(Number(v) - 50) > 2, helperText: "Standar: 50 Hz" },
                    { id: "voltRN", label: "Voltase R-N", type: "number", unit: "V", ngRule: (v) => Number(v) < 198 || Number(v) > 242, helperText: "Standar: 220 V ±10%" },
                    { id: "voltSN", label: "Voltase S-N", type: "number", unit: "V", ngRule: (v) => Number(v) < 198 || Number(v) > 242 },
                    { id: "voltTN", label: "Voltase T-N", type: "number", unit: "V", ngRule: (v) => Number(v) < 198 || Number(v) > 242 },
                    { id: "voltRS", label: "Voltase R-S", type: "number", unit: "V", ngRule: (v) => Number(v) < 370 || Number(v) > 415, helperText: "Standar: 370–415 V" },
                    { id: "voltST", label: "Voltase S-T", type: "number", unit: "V", ngRule: (v) => Number(v) < 342 || Number(v) > 418, helperText: "Standar: 380 V ±10%" },
                    { id: "voltRT", label: "Voltase R-T", type: "number", unit: "V", ngRule: (v) => Number(v) < 342 || Number(v) > 418 },
                    { id: "kebersihan", label: "Kebersihan Panel", type: "toggle", helperText: "O = Bersih" },
                    { id: "kebersihanRuangan", label: "Kebersihan Ruangan", type: "toggle", helperText: "O = Bersih, X = Kotor (NG)" },
                ],
            },
            {
                id: "TRAVO",
                name: "Main Distribution Transformer",
                items: [
                    { id: "tempRuang", label: "Temperatur Ruangan", type: "number", unit: "°C", ngRule: (v) => Number(v) > 40, helperText: "Maks: 40°C" },
                    { id: "pelampungBesar", label: "Pelampung Besar (Level Oli)", type: "dropdown", options: ["Atas", "Bawah"], ngRule: (v) => v === "Bawah", helperText: "Atas = OK" },
                    { id: "pelampungKecil", label: "Pelampung Kecil (Level Oli)", type: "dropdown", options: ["Atas", "Bawah"], ngRule: (v) => v === "Bawah" },
                    { id: "lampuIncR", label: "Lampu Incoming R", type: "dropdown", options: ["ON", "OFF"], ngRule: (v) => v === "OFF" },
                    { id: "lampuIncS", label: "Lampu Incoming S", type: "dropdown", options: ["ON", "OFF"], ngRule: (v) => v === "OFF" },
                    { id: "lampuIncT", label: "Lampu Incoming T", type: "dropdown", options: ["ON", "OFF"], ngRule: (v) => v === "OFF" },
                    { id: "lampuOutR", label: "Lampu Outgoing R", type: "dropdown", options: ["ON", "OFF"], ngRule: (v) => v === "OFF" },
                    { id: "lampuOutS", label: "Lampu Outgoing S", type: "dropdown", options: ["ON", "OFF"], ngRule: (v) => v === "OFF" },
                    { id: "lampuOutT", label: "Lampu Outgoing T", type: "dropdown", options: ["ON", "OFF"], ngRule: (v) => v === "OFF" },
                    { id: "tempTrafo", label: "Temperatur Trafo", type: "number", unit: "°C", ngRule: (v) => Number(v) > 80, helperText: "Maks: 80°C" },
                    { id: "kebocoranTrafo", label: "Kebocoran Trafo", type: "dropdown", options: ["Nihil / Bersih", "Packing", "Bushing", "Tangki"], ngRule: (v) => v !== "Nihil / Bersih" },
                    { id: "kebersihan", label: "Kebersihan", type: "toggle" },
                ],
            },
        ],
    },
    {
        id: "AIR_COMP",
        name: "Sistem Penghasil Udara Bertekanan",
        shortName: "Air Compressor & Dryer",
        icon: <Wind size={20} />,
        color: "#065f46",
        bgColor: "#ecfdf5",
        borderColor: "#6ee7b7",
        equipment: [
            {
                id: "STORAGE-TANK",
                name: "Tangki Penampung Udara Bertekanan",
                items: [
                    { id: "bocorUdara", label: "Kebocoran Udara", type: "toggle", helperText: "O = Tidak ada kebocoran" },
                    { id: "airPressure", label: "Air Pressure", type: "number", unit: "kg/cm²", ngRule: (v) => Number(v) < 5.0 || Number(v) > 11.5, helperText: "Standar: 5.0–11.5 kg/cm²" },
                    { id: "kebersihan", label: "Kebersihan", type: "toggle" },
                    { id: "saluranKondensasi", label: "Saluran Kondensasi", type: "toggle", helperText: "O = Katup berfungsi lancar" },
                ],
            },
            {
                id: "COMP-FIX-3",
                name: "Compressor Fixed Speed Unit 3 (GA55)",
                items: [
                    { id: "tempRuang", label: "Temperatur Ruangan", type: "number", unit: "°C", ngRule: (v) => Number(v) > 40 },
                    { id: "levelOli", label: "Level Oli", type: "dropdown", options: ["Normal (Max / Oranye)", "Kurang"], ngRule: (v) => v !== "Normal (Max / Oranye)" },
                    { id: "bocorOli", label: "Kebocoran Oli", type: "toggle", helperText: "O = Tidak ada bocor" },
                    { id: "manualDrainValve", label: "Manual Drain Valve", type: "toggle", helperText: "O = Air keluar lancar" },
                    { id: "hoseManualDrain", label: "Hose Manual Drain", type: "toggle", helperText: "O = Selang tidak bocor" },
                    { id: "suhuComp", label: "Suhu Compressor", type: "number", unit: "°C", ngRule: (v) => Number(v) > 110, helperText: "Maks: 110°C" },
                    { id: "runningHours", label: "Running Hours", type: "number", unit: "jam" },
                    { id: "indicatorFilterUdara", label: "Indikator Filter Udara", type: "number", unit: "%", ngRule: (v) => Number(v) < 20 || Number(v) > 100, helperText: "Standar: 20–100%" },
                    { id: "dpOilSeparator", label: "dP Oil Separator", type: "number", unit: "bar", ngRule: (v) => Number(v) > 0.8, helperText: "Maks: 0.8 bar" },
                    { id: "filterFan", label: "Filter Fan", type: "toggle", helperText: "O = Bersih setelah dilepas" },
                    { id: "kebersihan", label: "Kebersihan", type: "toggle" },
                ],
            },
            {
                id: "COMP-VSD",
                name: "Compressor VSD (GA55 VSD 1, 4, 5)",
                items: [
                    { id: "tempRuang", label: "Temperatur Ruangan", type: "number", unit: "°C", ngRule: (v) => Number(v) > 40 },
                    { id: "levelOli", label: "Level Oli", type: "dropdown", options: ["Normal (Max / Oranye)", "Kurang"], ngRule: (v) => v !== "Normal (Max / Oranye)" },
                    { id: "bocorOli", label: "Kebocoran Oli", type: "toggle" },
                    { id: "manualDrainValve", label: "Manual Drain Valve", type: "toggle", helperText: "O = Air keluar lancar" },
                    { id: "hoseManualDrain", label: "Hose Manual Drain", type: "toggle" },
                    { id: "suhuComp", label: "Suhu Compressor", type: "number", unit: "°C", ngRule: (v) => Number(v) > 110, helperText: "Maks: 110°C" },
                    { id: "runningHours", label: "Running Hours", type: "number", unit: "jam" },
                    { id: "indicatorFilterUdara", label: "Indikator Filter Udara", type: "number", unit: "%", ngRule: (v) => Number(v) < 20 || Number(v) > 50, helperText: "Standar: 20–50%" },
                    { id: "dpOilSeparator", label: "dP Oil Separator", type: "number", unit: "bar", ngRule: (v) => Number(v) > 0.8, helperText: "Maks: 0.8 bar" },
                    { id: "filterFan", label: "Filter Fan", type: "toggle" },
                    { id: "kebersihan", label: "Kebersihan", type: "toggle" },
                ],
            },
            {
                id: "PANEL-KONTAKTOR-COMP",
                name: "Panel Daya & Kontaktor Kompresor",
                items: [
                    { id: "suhuK21", label: "Suhu Kontaktor K21", type: "number", unit: "°C", ngRule: (v) => Number(v) > 85, helperText: "Maks: 85°C" },
                    { id: "suhuF21", label: "Suhu Kontaktor F21", type: "number", unit: "°C", ngRule: (v) => Number(v) > 85 },
                    { id: "suhuK23", label: "Suhu Kontaktor K23", type: "number", unit: "°C", ngRule: (v) => Number(v) > 85 },
                    { id: "suhuK22", label: "Suhu Kontaktor K22", type: "number", unit: "°C", ngRule: (v) => Number(v) > 85 },
                    { id: "arusMotorScrewU", label: "Arus Motor Screw – U", type: "number", unit: "A", helperText: "Nominal ~70 A" },
                    { id: "arusMotorScrewV", label: "Arus Motor Screw – V", type: "number", unit: "A" },
                    { id: "arusMotorScrewW", label: "Arus Motor Screw – W", type: "number", unit: "A" },
                    { id: "arusFanBlowerU", label: "Arus Fan Blower – U", type: "number", unit: "A", helperText: "Nominal ~5 A" },
                    { id: "arusFanBlowerV", label: "Arus Fan Blower – V", type: "number", unit: "A" },
                    { id: "arusFanBlowerW", label: "Arus Fan Blower – W", type: "number", unit: "A" },
                ],
            },
            {
                id: "TERMOGRAFI-COMP-VSD",
                name: "Termografi Suhu Kabel & Komponen Kompresor VSD",
                items: [
                    { id: "epcosFiltKabel", label: "IN EPCOS Filter – Suhu Kabel", type: "number", unit: "°C", ngRule: (v) => Number(v) > 60, helperText: "Standar: 50–60°C" },
                    { id: "epcosFiltKoneksi", label: "IN EPCOS Filter – Suhu Koneksi", type: "number", unit: "°C", ngRule: (v) => Number(v) > 72, helperText: "Maks: 72°C" },
                    { id: "outFanRadialKabel", label: "OUT Fan Radial – Suhu Kabel", type: "number", unit: "°C", ngRule: (v) => Number(v) > 60 },
                    { id: "outFanRadialKoneksi", label: "OUT Fan Radial – Suhu Koneksi", type: "number", unit: "°C", ngRule: (v) => Number(v) > 72 },
                    { id: "inInverterKabel", label: "IN Inverter – Suhu Kabel", type: "number", unit: "°C", ngRule: (v) => Number(v) > 60 },
                    { id: "inInverterKoneksi", label: "IN Inverter – Suhu Koneksi", type: "number", unit: "°C", ngRule: (v) => Number(v) > 72 },
                    { id: "outInverterKabel", label: "OUT Inverter – Suhu Kabel", type: "number", unit: "°C", ngRule: (v) => Number(v) > 60 },
                    { id: "outInverterKoneksi", label: "OUT Inverter – Suhu Koneksi", type: "number", unit: "°C", ngRule: (v) => Number(v) > 72 },
                    { id: "contactorFanRadialKabel", label: "Contactor Fan Radial – Suhu Kabel", type: "number", unit: "°C", ngRule: (v) => Number(v) > 60 },
                    { id: "contactorFanRadialKoneksi", label: "Contactor Fan Radial – Suhu Koneksi", type: "number", unit: "°C", ngRule: (v) => Number(v) > 72 },
                    { id: "coolingFanInverter", label: "Cooling Fan Inverter", type: "toggle", helperText: "O = Bersih dan berputar normal" },
                ],
            },
            {
                id: "DRYER-ARX90",
                name: "Air Dryer Orion ARX90HL",
                items: [
                    { id: "suaraNormal", label: "Suara Normal", type: "toggle" },
                    { id: "tombolPower", label: "Tombol Power", type: "toggle" },
                    { id: "lampuIndikator", label: "Lampu Indikator", type: "toggle" },
                    { id: "airPressure", label: "Air Pressure", type: "number", unit: "MPa", ngRule: (v) => Number(v) < 0.5 || Number(v) > 0.7, helperText: "Standar: 0.5–0.7 MPa" },
                    { id: "evapPressure", label: "Evaporator Pressure", type: "number", unit: "MPa", ngRule: (v) => Number(v) < 0.7 || Number(v) > 1.15, helperText: "Standar: 0.7–1.15 MPa" },
                    { id: "filterKondensor", label: "Filter Kondensor", type: "toggle", helperText: "O = Bersih, tidak berdebu" },
                    { id: "autoDrain", label: "Auto Drain", type: "toggle", helperText: "O = Berfungsi & gelas filter tidak penuh" },
                ],
            },
            {
                id: "DRYER-FX14",
                name: "Air Dryer Atlas Copco FX14",
                items: [
                    { id: "suaraNormal", label: "Suara Normal", type: "toggle" },
                    { id: "tombolPower", label: "Tombol Power", type: "toggle" },
                    { id: "lampuIndikator", label: "Lampu Indikator", type: "toggle" },
                    { id: "airPressure", label: "Air Pressure", type: "number", unit: "MPa", ngRule: (v) => Number(v) < 0.5 || Number(v) > 0.7, helperText: "Standar: 0.5–0.7 MPa" },
                    { id: "evapPressure", label: "Evaporator Pressure", type: "number", unit: "MPa", ngRule: (v) => Number(v) < 0.7 || Number(v) > 1.15 },
                    { id: "filterKondensor", label: "Filter Kondensor", type: "toggle" },
                    { id: "autoDrain", label: "Auto Drain", type: "toggle" },
                    { id: "filterUdaraColor", label: "Filter Udara – Warna Indikator", type: "dropdown", options: ["Hijau", "Kuning"], ngRule: (v) => v !== "Hijau", helperText: "Hijau = OK, Kuning = NG" },
                    { id: "tempDewpoint", label: "Temperatur Dewpoint", type: "number", unit: "°C", ngRule: (v) => Number(v) > 20, helperText: "Maks: 20°C" },
                    { id: "extraFan", label: "Extra Fan", type: "dropdown", options: ["Berputar", "Mati"], ngRule: (v) => v !== "Berputar" },
                ],
            },
        ],
    },
    {
        id: "FIRE_HYDRANT",
        name: "Sistem Proteksi Kebakaran",
        shortName: "Fire Hydrant",
        icon: <Shield size={20} />,
        color: "#991b1b",
        bgColor: "#fef2f2",
        borderColor: "#fca5a5",
        equipment: [
            {
                id: "BOOSTER-PUMP",
                name: "Fire Hydrant Booster Pump (Pompa 1, 2, 3)",
                items: [
                    { id: "suaraMotorP1", label: "Pompa 1 – Suara Motor", type: "toggle", helperText: "O = Suara & putaran normal" },
                    { id: "kondisiKoplingP1", label: "Pompa 1 – Kondisi Kopling", type: "toggle", helperText: "O = Tidak bocor & karet kopling tidak aus" },
                    { id: "suaraMotorP2", label: "Pompa 2 – Suara Motor", type: "toggle" },
                    { id: "kondisiKoplingP2", label: "Pompa 2 – Kondisi Kopling", type: "toggle" },
                    { id: "suaraMotorP3", label: "Pompa 3 – Suara Motor", type: "toggle" },
                    { id: "kondisiKoplingP3", label: "Pompa 3 – Kondisi Kopling", type: "toggle" },
                    { id: "pressureGaugeUtama", label: "Pressure Gauge Utama", type: "number", unit: "bar", helperText: "Standar: ~3 Bar" },
                    { id: "panelBooster", label: "Panel Booster", type: "toggle", helperText: "O = Fungsi, fan, & kebersihan OK" },
                    { id: "kondisiFisikKarat", label: "Kondisi Fisik (Karat)", type: "toggle", helperText: "O = Bebas karat berlebih" },
                    { id: "pompaBeroperasi", label: "Pompa Beroperasi", type: "text", placeholder: "Contoh: Pompa 2 + 3" },
                    { id: "kebersihanRuangan", label: "Kebersihan Ruangan", type: "toggle" },
                ],
            },
        ],
    },
];

const ALL_EQUIPMENT: EquipmentSheet[] = SYSTEM_GROUPS.flatMap((g) => g.equipment);

const SHIFT_PRESETS: { label: string; start: string; end: string }[] = [
    { label: "Shift Pagi", start: "07:00", end: "19:00" },
    { label: "Shift Malam", start: "19:00", end: "07:00" },
];

function getGroupForEquipment(equipId: string): SystemGroup | undefined {
    return SYSTEM_GROUPS.find((g) => g.equipment.some((e) => e.id === equipId));
}

function getEquipmentById(equipId: string): EquipmentSheet | undefined {
    return ALL_EQUIPMENT.find((e) => e.id === equipId);
}

// ─── UTILITY HELPERS ─────────────────────────────────────────────────────────

function isToggleNG(val: string): boolean {
    return val === "X";
}

function isItemNG(item: CheckItem, value: string): boolean {
    if (!value || value === "") return false;
    if (item.type === "toggle") return isToggleNG(value);
    if (item.ngRule) return item.ngRule(value);
    return false;
}

function calculateEquipScore(equip: EquipmentSheet, values: FormValues): { ok: number; total: number; percent: number } {
    const equipVals = values[equip.id] ?? {};
    let ok = 0;
    let total = 0;
    for (const item of equip.items) {
        const v = equipVals[item.id] ?? "";
        if (!v) continue;
        total++;
        if (!isItemNG(item, v)) ok++;
    }
    const percent = total === 0 ? 0 : Math.round((ok / total) * 100);
    return { ok, total, percent };
}

function calculateOverallScore(values: FormValues): number {
    let ok = 0;
    let total = 0;
    for (const equip of ALL_EQUIPMENT) {
        const s = calculateEquipScore(equip, values);
        ok += s.ok;
        total += s.total;
    }
    return total === 0 ? 0 : Math.round((ok / total) * 100);
}

function collectNGItems(values: FormValues): NGItem[] {
    const ngs: NGItem[] = [];
    for (const equip of ALL_EQUIPMENT) {
        const equipVals = values[equip.id] ?? {};
        for (const item of equip.items) {
            const v = equipVals[item.id] ?? "";
            if (v && isItemNG(item, v)) {
                ngs.push({ equipId: equip.id, itemId: item.id, label: item.label });
            }
        }
    }
    return ngs;
}

function isEquipFilled(equipId: string, values: FormValues): boolean {
    const vals = values[equipId] ?? {};
    return Object.values(vals).some((v) => v !== "" && v !== undefined);
}

function isEquipComplete(equip: EquipmentSheet, values: FormValues): boolean {
    const vals = values[equip.id] ?? {};
    return equip.items.every((item) => (vals[item.id] ?? "") !== "");
}

function filledItemCount(equip: EquipmentSheet, values: FormValues): number {
    const vals = values[equip.id] ?? {};
    return equip.items.filter((item) => (vals[item.id] ?? "") !== "").length;
}

function scoreTone(percent: number, hasNG: boolean): "ng" | "ok" | "mid" | "low" | "none" {
    if (hasNG) return "ng";
    if (percent === 100) return "ok";
    if (percent >= 60) return "mid";
    if (percent > 0) return "low";
    return "none";
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DRAFT_KEY_PREFIX = "echecksheet_ph_draft_";

// ─── STYLES ──────────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

.ph {
  --ink:#0e1a2b; --ink-2:#1b2d47; --steel:#5b6b80; --mist:#94a3b8; --line:#e3e8ef;
  --paper:#f4f6f9; --card:#ffffff; --amber:#f5a524; --ok:#16a34a; --ok-bg:#e8f7ee;
  --ng:#dc2626; --ng-bg:#fdecec; --info:#2563eb; --info-bg:#eaf1ff;
  --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  display:flex; min-height:100vh; background:var(--paper); color:var(--ink);
  font-family:'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',sans-serif;
}
.ph *{box-sizing:border-box}
.ph button{font-family:inherit}
.ph-main{flex:1;min-width:0;padding:24px 28px 40px;max-width:1320px;margin:0 auto}
.ph :focus-visible{outline:2.5px solid var(--info);outline-offset:2px}

/* HERO */
.ph-hero{position:relative;overflow:hidden;border-radius:18px;padding:22px 26px;margin-bottom:18px;color:#fff;
  background:
    repeating-linear-gradient(135deg,rgba(245,165,36,.0) 0 18px,rgba(245,165,36,.07) 18px 20px),
    linear-gradient(115deg,#0b1626 0%,#14263f 60%,#1b3556 100%);
  box-shadow:0 14px 30px -14px rgba(11,22,38,.7);
  display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
.ph-hero::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--amber)}
.ph-hero-l{display:flex;align-items:center;gap:16px;padding-left:6px}
.ph-hero-ico{width:48px;height:48px;border-radius:14px;background:rgba(245,165,36,.16);border:1px solid rgba(245,165,36,.45);
  display:grid;place-items:center;color:var(--amber)}
.ph-hero h1{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em}
.ph-hero p{margin:3px 0 0;font-size:12.5px;color:#b6c3d6}
.ph-hero-r{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ph-chip{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);color:#e5ecf6}
.ph-dot{width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.6);animation:phPulse 2s infinite}
.ph-dot.off{background:#f87171;animation:none}
.ph-hero-ring{display:flex;align-items:center;gap:10px;padding:6px 14px 6px 8px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);font-size:12px;font-weight:600;color:#e5ecf6}

/* TABS */
.ph-tabs{display:inline-flex;gap:4px;padding:4px;border-radius:12px;background:#e9edf3;margin-bottom:20px}
.ph-tab{display:flex;align-items:center;gap:7px;padding:8px 18px;border:none;border-radius:9px;background:transparent;
  font-size:13.5px;font-weight:700;color:var(--steel);cursor:pointer;transition:background .15s,color .15s}
.ph-tab:hover{color:var(--ink)}
.ph-tab.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(14,26,43,.14)}

/* WIZARD */
.ph-steps{display:flex;align-items:center;gap:8px;margin-bottom:22px;flex-wrap:wrap}
.ph-step{display:flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border-radius:999px;border:1.5px solid var(--line);
  background:#fff;font-size:12.5px;font-weight:700;color:var(--steel);cursor:pointer}
.ph-step[disabled]{cursor:not-allowed;opacity:.5}
.ph-step-n{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#e9edf3;color:var(--steel);font-size:11.5px}
.ph-step.on{border-color:var(--ink);background:var(--ink);color:#fff}
.ph-step.on .ph-step-n{background:var(--amber);color:var(--ink)}
.ph-step.done .ph-step-n{background:var(--ok);color:#fff}
.ph-step-sep{width:22px;height:2px;background:var(--line);border-radius:2px}

.ph-banner{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;margin-bottom:18px;
  border-radius:12px;background:var(--info-bg);border:1px solid #c7dafd;color:#1d4ed8;font-size:12.5px;font-weight:500}
.ph-banner button{background:none;border:none;color:#1d4ed8;font-weight:800;cursor:pointer;font-size:12px}

.ph-h2{margin:0;font-size:17px;font-weight:800;letter-spacing:-.01em}
.ph-sub{margin:3px 0 0;font-size:13px;color:var(--steel)}
.ph-back{display:inline-flex;align-items:center;gap:5px;background:none;border:none;color:var(--steel);font-size:13px;font-weight:700;cursor:pointer;padding:0;margin-bottom:10px}
.ph-back:hover{color:var(--ink)}

/* AREA CARDS */
.ph-areas{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;margin-top:16px}
.ph-area{position:relative;text-align:left;cursor:pointer;background:#fff;border:1.5px solid var(--line);border-radius:16px;
  padding:18px 18px 16px 22px;overflow:hidden;transition:transform .15s,box-shadow .15s,border-color .15s}
.ph-area::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--c)}
.ph-area:hover{transform:translateY(-2px);box-shadow:0 12px 24px -14px var(--c);border-color:var(--c)}
.ph-area.sel{border-color:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 18%,transparent)}
.ph-area-top{display:flex;align-items:center;gap:12px}
.ph-area-ico{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:var(--c);background:var(--bg)}
.ph-area-name{font-size:15px;font-weight:800;letter-spacing:-.01em;line-height:1.25}
.ph-area-full{font-size:12px;color:var(--steel);margin-top:2px;line-height:1.35}
.ph-area-foot{display:flex;align-items:center;justify-content:space-between;margin-top:16px}
.ph-area-count{font-size:12.5px;color:var(--steel);font-weight:600}
.ph-area-count b{font-family:var(--mono);color:var(--ink);font-size:13px}
.ph-segbar{display:flex;gap:4px;flex:1;margin:0 12px}
.ph-seg{flex:1;height:7px;border-radius:4px;background:#e9edf3}
.ph-seg.f{background:var(--c)}

/* SHIFT */
.ph-card{background:#fff;border:1.5px solid var(--line);border-radius:16px;padding:22px}
.ph-presets{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}
.ph-pill-btn{padding:8px 16px;border-radius:999px;border:1.5px solid var(--line);background:#fff;color:var(--steel);font-weight:700;font-size:12.5px;cursor:pointer;transition:all .15s}
.ph-pill-btn:hover{border-color:var(--ink);color:var(--ink)}
.ph-pill-btn.on{background:var(--ink);border-color:var(--ink);color:#fff}
.ph-timerow{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap}
.ph-field label{display:block;font-size:12px;font-weight:700;color:var(--steel);margin-bottom:5px}
.ph-input{padding:9px 12px;border:1.5px solid var(--line);border-radius:10px;font-size:14px;font-family:var(--mono);background:#fff;color:var(--ink);transition:border-color .15s}
.ph-input:focus{outline:none;border-color:var(--info);box-shadow:0 0 0 3px rgba(37,99,235,.15)}
.ph-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:10px;border:none;background:var(--ink);color:#fff;font-weight:800;font-size:14px;cursor:pointer;transition:background .15s,transform .1s}
.ph-btn:hover:not([disabled]){background:var(--ink-2)}
.ph-btn:active:not([disabled]){transform:scale(.98)}
.ph-btn[disabled]{background:#b5c0cf;cursor:not-allowed}
.ph-btn.ghost{background:#fff;color:var(--steel);border:1.5px solid var(--line);font-weight:700}
.ph-btn.ghost:hover:not([disabled]){background:#f4f6f9;color:var(--ink)}
.ph-btn.sm{padding:7px 13px;font-size:12.5px;border-radius:9px}

/* EQUIPMENT LIST */
.ph-listhead{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.ph-gtitle{display:flex;align-items:center;gap:12px}
.ph-gico{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:#fff}
.ph-search{position:relative;max-width:340px;margin-bottom:16px}
.ph-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--mist)}
.ph-search input{width:100%;padding:10px 12px 10px 36px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;font-family:inherit;background:#fff}
.ph-search input:focus{outline:none;border-color:var(--info);box-shadow:0 0 0 3px rgba(37,99,235,.15)}
.ph-equips{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px;margin-bottom:22px}
.ph-eq{position:relative;display:flex;align-items:center;gap:14px;text-align:left;cursor:pointer;background:#fff;
  border:1.5px solid var(--line);border-radius:14px;padding:14px 16px 14px 20px;overflow:hidden;transition:transform .15s,box-shadow .15s}
.ph-eq::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--st)}
.ph-eq:hover{transform:translateY(-2px);box-shadow:0 10px 22px -14px rgba(14,26,43,.5)}
.ph-eq-body{flex:1;min-width:0}
.ph-eq-name{font-size:13.5px;font-weight:800;line-height:1.3}
.ph-eq-meta{font-size:11.5px;color:var(--steel);margin-top:3px}
.ph-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800;margin-top:7px}
.ph-tag.ng{background:var(--ng-bg);color:#b91c1c}
.ph-tag.ok{background:var(--ok-bg);color:#166534}
.ph-tag.info{background:var(--info-bg);color:#1d4ed8}
.ph-tag.warn{background:#fff6dd;color:#8a5a00}
.ph-tag.none{background:#eef1f5;color:var(--steel)}

.ph-alert{display:flex;gap:12px;align-items:flex-start;background:var(--ng-bg);border:1.5px solid #f6b4b4;border-radius:14px;padding:14px 16px;margin-bottom:20px}
.ph-alert-t{font-weight:800;font-size:13px;color:#991b1b;margin-bottom:8px}
.ph-alert-chips{display:flex;flex-wrap:wrap;gap:6px}
.ph-alert-chip{padding:3px 10px;border-radius:999px;background:#fff;border:1px solid #f6b4b4;color:#b91c1c;font-size:11.5px;font-weight:700}

/* INSPECTION PANEL */
.ph-panel{background:#fff;border:1.5px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 10px 26px -20px rgba(14,26,43,.5)}
.ph-panel-h{padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
  background:linear-gradient(0deg,#fff,var(--bg));border-bottom:1px solid var(--line);border-top:5px solid var(--c)}
.ph-panel-title{font-size:18px;font-weight:800;letter-spacing:-.01em;color:var(--c)}
.ph-panel-sub{font-size:12px;color:var(--steel);margin-top:2px}
.ph-saved-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800;background:var(--ok-bg);color:#166534;border:1px solid #a7e3bd;margin-left:10px;vertical-align:middle}
.ph-quick{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:10px;border:1.5px dashed #9db8f5;background:var(--info-bg);color:#1d4ed8;font-size:12.5px;font-weight:800;cursor:pointer}
.ph-quick:hover{background:#dce8ff}

.ph-prog{display:flex;align-items:center;gap:16px;padding:12px 22px;background:#fafbfd;border-bottom:1px solid var(--line);flex-wrap:wrap}
.ph-prog-bar{flex:1;min-width:160px;height:8px;border-radius:5px;background:#e9edf3;overflow:hidden}
.ph-prog-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,var(--c),color-mix(in srgb,var(--c) 60%,#fff));transition:width .35s}
.ph-prog-txt{font-size:12.5px;font-weight:700;color:var(--steel)}
.ph-prog-txt b{font-family:var(--mono);color:var(--ink)}

.ph-tw{overflow-x:auto}
.ph-t{width:100%;border-collapse:separate;border-spacing:0}
.ph-t thead th{position:sticky;top:0;z-index:2;background:#f4f6f9;padding:11px 14px;text-align:left;font-size:12px;font-weight:700;color:var(--steel);border-bottom:1.5px solid var(--line);white-space:nowrap}
.ph-t td{padding:12px 14px;border-bottom:1px solid #eef1f5;vertical-align:middle}
.ph-t tbody tr.row{transition:background .12s}
.ph-t tbody tr.row:hover{background:#f7f9fc}
.ph-t tr.row.ng{background:#fff4f4}
.ph-t tr.row.ng:hover{background:#ffeeee}
.ph-t td.no{width:46px;padding-left:18px}
.ph-t tr.row.ng td.no{box-shadow:inset 5px 0 0 var(--ng)}
.ph-t tr.row.okrow td.no{box-shadow:inset 5px 0 0 #86d6a3}
.ph-num{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:8px;background:#eef1f5;color:var(--steel);font-family:var(--mono);font-size:11.5px;font-weight:700}
.ph-item-l{font-size:13.5px;font-weight:700;line-height:1.3}
.ph-item-u{font-family:var(--mono);font-size:11px;color:var(--mist);margin-left:6px;font-weight:500}
.ph-std{display:inline-block;max-width:260px;padding:3px 9px;border-radius:7px;background:#f1f4f8;color:var(--steel);font-size:11.5px;line-height:1.35}
.ph-std.none{background:none;color:#cbd5e1;padding:0}

.ph-seg2{display:inline-flex;padding:3px;border-radius:11px;background:#eef1f5;gap:3px}
.ph-seg2 button{width:46px;height:32px;border:none;border-radius:8px;background:transparent;color:var(--mist);font-weight:800;font-size:15px;cursor:pointer;transition:all .15s}
.ph-seg2 button:hover:not([disabled]){background:#fff;color:var(--ink)}
.ph-seg2 button.o.on{background:var(--ok);color:#fff;box-shadow:0 3px 8px -2px rgba(22,163,74,.6)}
.ph-seg2 button.x.on{background:var(--ng);color:#fff;box-shadow:0 3px 8px -2px rgba(220,38,38,.6)}

.ph-field-in{position:relative;display:inline-flex;align-items:center}
.ph-field-in input{padding:8px 44px 8px 12px;border:1.5px solid var(--line);border-radius:10px;font-size:13.5px;font-family:var(--mono);font-weight:700;width:148px;background:#fff;color:var(--ink);transition:border-color .15s}
.ph-field-in input.plain{padding-right:12px;width:190px;font-family:inherit;font-weight:500}
.ph-field-in input:focus{outline:none;border-color:var(--info);box-shadow:0 0 0 3px rgba(37,99,235,.15)}
.ph-field-in input.bad{border-color:#f19a9a;background:#fff;color:#b91c1c}
.ph-unit{position:absolute;right:10px;font-size:11px;font-weight:700;color:var(--mist);pointer-events:none;font-family:var(--mono)}
.ph-select{position:relative;display:inline-block}
.ph-select select{appearance:none;padding:8px 32px 8px 12px;border:1.5px solid var(--line);border-radius:10px;background:#fff;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer;min-width:190px;font-family:inherit}
.ph-select select:focus{outline:none;border-color:var(--info);box-shadow:0 0 0 3px rgba(37,99,235,.15)}
.ph-select select.bad{border-color:#f19a9a;color:#b91c1c}
.ph-select svg{position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--mist)}

.ph-st{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:800;white-space:nowrap}
.ph-st.ok{background:var(--ok-bg);color:#166534}
.ph-st.ng{background:var(--ng-bg);color:#b91c1c}
.ph-st.idle{background:#f1f4f8;color:var(--mist);font-weight:600}

.ph-t tr.note td{background:#fff4f4;padding:0 18px 14px 60px;border-bottom:1px solid #f6d3d3}
.ph-note{display:flex;gap:10px;align-items:flex-start}
.ph-note-l{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;color:#b91c1c;padding-top:9px;white-space:nowrap}
.ph-note textarea{flex:1;padding:8px 12px;border:1.5px solid #f19a9a;border-radius:10px;font-size:12.5px;font-family:inherit;resize:vertical;min-height:40px;background:#fff}
.ph-note textarea.has{border-color:#86d6a3}
.ph-note textarea:focus{outline:none;box-shadow:0 0 0 3px rgba(37,99,235,.15)}

.ph-catatan-box{padding:14px 20px;border-top:1.5px solid var(--line);background:#fafbfd}
.ph-catatan-box-t{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--steel);margin-bottom:8px}
.ph-catatan-box textarea{width:100%;padding:10px 14px;border:1.5px solid var(--line);border-radius:10px;font-size:13px;font-family:inherit;resize:vertical;min-height:54px;background:#fff;color:var(--ink);transition:border-color .15s}
.ph-catatan-box textarea:focus{outline:none;border-color:var(--info);box-shadow:0 0 0 3px rgba(37,99,235,.15)}

.ph-foot{position:sticky;bottom:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
  padding:14px 22px;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-top:1.5px solid var(--line)}
.ph-save{display:inline-flex;align-items:center;gap:8px;padding:11px 26px;border-radius:11px;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;transition:transform .1s,box-shadow .15s}
.ph-save:hover:not([disabled]){box-shadow:0 8px 18px -8px rgba(0,0,0,.45)}
.ph-save:active:not([disabled]){transform:scale(.98)}
.ph-save[disabled]{cursor:not-allowed}

/* HISTORY */
.ph-filters{display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap}
.ph-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:18px}
.ph-kpi{position:relative;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:14px 18px 14px 22px;overflow:hidden}
.ph-kpi::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:var(--k)}
.ph-kpi-l{font-size:12px;color:var(--steel);font-weight:700}
.ph-kpi-v{font-family:var(--mono);font-size:28px;font-weight:700;color:var(--k);margin-top:4px;letter-spacing:-.02em}
.ph-grid2{display:grid;grid-template-columns:minmax(260px,1fr) minmax(320px,1.4fr);gap:16px;margin-bottom:20px}
@media (max-width:900px){.ph-grid2{grid-template-columns:1fr}.ph-main{padding:16px}}
.ph-box{background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:16px 20px}
.ph-box-t{font-weight:800;font-size:13.5px;margin-bottom:14px}
.ph-cat{display:grid;grid-template-columns:150px 1fr 34px;align-items:center;gap:10px;margin-bottom:11px;font-size:12.5px}
.ph-cat-l{color:var(--steel);font-weight:600}
.ph-cat-bar{height:10px;border-radius:6px;background:#eef1f5;overflow:hidden}
.ph-cat-fill{height:100%;border-radius:6px;transition:width .4s}
.ph-cat-n{font-family:var(--mono);font-weight:700;text-align:right}
.ph-bars rect{transition:opacity .15s}
.ph-bars g:hover rect{opacity:.75}

.ph-ht-card{background:#fff;border:1.5px solid var(--line);border-radius:14px;overflow:hidden}
.ph-ht-head{padding:14px 20px;border-bottom:1px solid var(--line);font-weight:800;font-size:13.5px;display:flex;align-items:center;gap:8px}
.ph-ht-head span{font-family:var(--mono);background:#eef1f5;border-radius:6px;padding:1px 8px;font-size:12px}
.ph-av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--ink);color:#fff;font-size:12px;font-weight:800;flex-shrink:0}
.ph-date{font-family:var(--mono);font-size:12.5px;font-weight:700}
.ph-time{font-size:11.5px;color:var(--mist)}
.ph-score{display:flex;align-items:center;gap:8px;min-width:120px}
.ph-score-bar{flex:1;height:7px;border-radius:4px;background:#eef1f5;overflow:hidden}
.ph-score-fill{height:100%;border-radius:4px}
.ph-score-v{font-family:var(--mono);font-size:12px;font-weight:700;width:40px;text-align:right}
.ph-act{display:flex;gap:6px}
.ph-ibtn{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:8px;border:1px solid var(--line);background:#fff;font-size:12px;font-weight:700;color:var(--steel);cursor:pointer;transition:all .12s}
.ph-ibtn:hover{background:#f4f6f9;color:var(--ink)}
.ph-ibtn.edit{color:#1d4ed8;border-color:#c7dafd;background:var(--info-bg)}
.ph-ibtn.del{color:#dc2626;border-color:#f6c6c6;background:var(--ng-bg)}
.ph-empty{padding:44px 20px;text-align:center;color:var(--steel);font-size:14px}
.ph-empty b{display:block;color:var(--ink);margin-bottom:4px;font-size:15px}

/* MODAL & TOAST */
.ph-modal{position:fixed;inset:0;background:rgba(10,18,30,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;animation:phFade .15s}
.ph-sheet{background:#fff;border-radius:18px;padding:26px;max-height:85vh;overflow-y:auto;animation:phPop .2s ease-out}
.ph-sheet-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;gap:12px}
.ph-x{background:#f1f4f8;border:none;border-radius:9px;width:32px;height:32px;display:grid;place-items:center;cursor:pointer;color:var(--steel)}
.ph-x:hover{background:#e5eaf1}
.ph-info{background:#f6f8fb;border-radius:10px;padding:9px 13px}
.ph-info-l{font-size:11.5px;color:var(--mist);font-weight:700;margin-bottom:2px}
.ph-info-v{font-size:13px;font-weight:700}
.ph-det{margin-bottom:10px;border:1px solid var(--line);border-radius:12px;padding:0 14px}
.ph-det summary{cursor:pointer;font-weight:700;font-size:13px;padding:11px 0}
.ph-toast{position:fixed;top:24px;right:24px;z-index:9999;display:flex;align-items:flex-start;gap:12px;padding:13px 16px;border-radius:12px;max-width:420px;
  color:#fff;font-size:13.5px;font-weight:600;box-shadow:0 16px 32px -12px rgba(0,0,0,.4);animation:phSlide .25s ease-out}

@keyframes phSlide{from{transform:translateY(-12px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes phFade{from{opacity:0}to{opacity:1}}
@keyframes phPop{from{transform:scale(.97);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes phSpin{to{transform:rotate(360deg)}}
@keyframes phPulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.55)}70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
.ph-spin{animation:phSpin 1s linear infinite}
@media (prefers-reduced-motion:reduce){.ph *{animation:none!important;transition:none!important}}
`;

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Ring({ value, total, size = 36, stroke = 4, color = "#16a34a", track = "#e9edf3", label = true, light = false }: {
    value: number; total: number; size?: number; stroke?: number; color?: string; track?: string; label?: boolean; light?: boolean;
}) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = total === 0 ? 0 : Math.min(1, value / total);
    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .4s" }} />
            </svg>
            {label && (
                <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: size * 0.28, fontWeight: 800, fontFamily: "var(--mono)", color: light ? "#fff" : "#0e1a2b" }}>
                    {Math.round(pct * 100)}
                </div>
            )}
        </div>
    );
}

function ToggleCell({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
    return (
        <div className="ph-seg2" role="group">
            {(["O", "X"] as const).map((sym) => (
                <button
                    key={sym}
                    type="button"
                    disabled={disabled}
                    aria-pressed={value === sym}
                    title={sym === "O" ? "Normal" : "NG / Abnormal"}
                    className={`${sym.toLowerCase()} ${value === sym ? "on" : ""}`}
                    onClick={() => onChange(value === sym ? "" : sym)}
                >
                    {sym}
                </button>
            ))}
        </div>
    );
}

function DropdownCell({ value, options, onChange, disabled, bad }: {
    value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean; bad?: boolean;
}) {
    return (
        <div className="ph-select">
            <select value={value} disabled={disabled} className={bad ? "bad" : ""} onChange={(e) => onChange(e.target.value)}>
                <option value="">Pilih...</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={14} />
        </div>
    );
}

function WizardSteps({ step, canGoShift, canGoInspection, onNavigate }: {
    step: "area" | "shift" | "inspection-list" | "inspection-item";
    canGoShift: boolean;
    canGoInspection: boolean;
    onNavigate: (s: "area" | "shift" | "inspection-list") => void;
}) {
    const items: { key: "area" | "shift" | "inspection-list"; label: string; icon: React.ReactNode; enabled: boolean }[] = [
        { key: "area", label: "Pilih Area", icon: <MapPin size={14} />, enabled: true },
        { key: "shift", label: "Jam Shift", icon: <Clock size={14} />, enabled: canGoShift },
        { key: "inspection-list", label: "Inspeksi", icon: <ClipboardList size={14} />, enabled: canGoInspection },
    ];
    const activeKey = step === "inspection-item" ? "inspection-list" : step;
    const activeIdx = items.findIndex((i) => i.key === activeKey);
    return (
        <div className="ph-steps">
            {items.map((it, idx) => {
                const isActive = it.key === activeKey;
                const done = idx < activeIdx;
                return (
                    <React.Fragment key={it.key}>
                        <button
                            disabled={!it.enabled}
                            onClick={() => it.enabled && onNavigate(it.key)}
                            className={`ph-step ${isActive ? "on" : ""} ${done ? "done" : ""}`}
                        >
                            <span className="ph-step-n">{done ? <Check size={13} /> : idx + 1}</span>
                            {it.label}
                        </button>
                        {idx < items.length - 1 && <span className="ph-step-sep" />}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="ph-modal" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="ph-info">
            <div className="ph-info-l">{label}</div>
            <div className="ph-info-v">{value}</div>
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function EChecksheetPowerHouseForm() {
    const router = useRouter();
    const { user } = useAuth();
    const isOnline = useConnection();

    const [activeTab, setActiveTab] = useState<"form" | "history">("form");

    // ── Wizard state ──
    const [step, setStep] = useState<"area" | "shift" | "inspection-list" | "inspection-item">("area");
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [shiftStart, setShiftStart] = useState<string>("");
    const [shiftEnd, setShiftEnd] = useState<string>("");
    const [currentEquipId, setCurrentEquipId] = useState<string | null>(null);
    const [equipSearch, setEquipSearch] = useState("");

    const [formValues, setFormValues] = useState<FormValues>({});
    const [ngItems, setNgItems] = useState<NGItem[]>([]);
    const [catatanNG, setCatatanNG] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

    // History states
    const [sessions, setSessions] = useState<InspectionSession[]>([]);
    const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
    const [historyMonth, setHistoryMonth] = useState<number>(new Date().getMonth());
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [detailSession, setDetailSession] = useState<InspectionSession | null>(null);
    const [editSession, setEditSession] = useState<InspectionSession | null>(null);
    const [editTargetEquipId, setEditTargetEquipId] = useState<string | null>(null);
    const [showAllInEdit, setShowAllInEdit] = useState<boolean>(false);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Helper membuka modal edit dengan target item/peralatan spesifik
    function handleOpenEditModal(session: InspectionSession, targetEquipId?: string) {
        setEditSession(session);
        setEditTargetEquipId(targetEquipId ?? null);
        setShowAllInEdit(!targetEquipId);
    }

    const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const tglISO = new Date().toISOString().slice(0, 10);
    const draftKey = `${DRAFT_KEY_PREFIX}${tglISO}`;

    // Auto-dismiss toast
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const currentGroup = useMemo(() => (selectedGroupId ? SYSTEM_GROUPS.find((g) => g.id === selectedGroupId) ?? null : null), [selectedGroupId]);
    const currentEquip = useMemo(() => (currentEquipId ? getEquipmentById(currentEquipId) : null), [currentEquipId]);
    const currentEquipGroup = useMemo(() => (currentEquipId ? getGroupForEquipment(currentEquipId) : null), [currentEquipId]);

    // Recalculate NG items whenever values change
    useEffect(() => {
        setNgItems(collectNGItems(formValues));
    }, [formValues]);

    // ── Restore draft on mount ──
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(draftKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && (Object.keys(parsed.formValues ?? {}).length > 0)) {
                    setFormValues(parsed.formValues ?? {});
                    setCatatanNG(parsed.catatanNG ?? {});
                    setShiftStart(parsed.shiftStart ?? "");
                    setShiftEnd(parsed.shiftEnd ?? "");
                    setSelectedGroupId(parsed.selectedGroupId ?? null);
                    setDraftRestoredAt(parsed.savedAt ?? null);
                    if (parsed.selectedGroupId) {
                        setStep(parsed.shiftStart && parsed.shiftEnd ? "inspection-list" : "shift");
                    }
                }
            }
        } catch { /* ignore corrupted draft */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Autosave draft ──
    useEffect(() => {
        const hasContent = Object.keys(formValues).length > 0 || !!shiftStart || !!selectedGroupId;
        if (!hasContent) return;
        try {
            window.localStorage.setItem(draftKey, JSON.stringify({
                formValues, catatanNG, shiftStart, shiftEnd, selectedGroupId,
                savedAt: new Date().toISOString(),
            }));
        } catch { /* storage unavailable */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formValues, catatanNG, shiftStart, shiftEnd, selectedGroupId]);

    // ── Load history / sessions on mount and when filters change ──
    useEffect(() => {
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [historyYear, historyMonth]);

    async function loadHistory() {
        setIsLoadingHistory(true);
        try {
            const res = await fetch(
                `/e-checksheet-ga/api/powerhouse/inspections?year=${historyYear}&month=${historyMonth + 1}`
            );
            if (res.ok) {
                const data = await res.json();
                if (data.sessions) {
                    setSessions(data.sessions);
                    return;
                }
            }
            throw new Error("API not available");
        } catch {
            // Fallback to local storage if offline or network error
            const all = JSON.parse(
                window.localStorage.getItem("echecksheet_ph_sessions") ?? "[]"
            ) as InspectionSession[];
            const filtered = all.filter((s) => {
                const d = new Date(s.createdAt);
                return d.getFullYear() === historyYear && d.getMonth() === historyMonth;
            });
            setSessions(filtered);
        } finally {
            setIsLoadingHistory(false);
        }
    }

    function handleItemChange(equipId: string, itemId: string, value: string) {
        setFormValues((prev) => ({
            ...prev,
            [equipId]: {
                ...(prev[equipId] ?? {}),
                [itemId]: value,
            },
        }));
    }

    function getItemValue(equipId: string, itemId: string): string {
        return formValues[equipId]?.[itemId] ?? "";
    }

    function handleQuickFillNormal(equip: EquipmentSheet) {
        setFormValues((prev) => {
            const next = { ...(prev[equip.id] ?? {}) };
            for (const item of equip.items) {
                if (item.type === "toggle" && !next[item.id]) next[item.id] = "O";
            }
            return { ...prev, [equip.id]: next };
        });
    }

    const overallScore = useMemo(() => calculateOverallScore(formValues), [formValues]);
    void overallScore;

    const allNGHaveCatatan = useMemo(
        () => ngItems.every((ng) => (catatanNG[`${ng.equipId}_${ng.itemId}`] ?? "").trim().length > 0),
        [ngItems, catatanNG]
    );

    // Cek apakah alat tertentu sudah tersimpan hari ini (baik di DB/localStorage sessions)
    const savedEquipMap = useMemo(() => {
        const map = new Map<string, InspectionSession>();
        for (const s of sessions) {
            const sDate = s.tgl ? s.tgl.slice(0, 10) : "";
            if (sDate === tglISO) {
                const equipIds = Object.keys(s.values ?? {});
                for (const eid of equipIds) {
                    if (!map.has(eid)) map.set(eid, s);
                }
                if (s.id) {
                    const match = s.id.match(/PH-\d+-(.+)$/);
                    if (match && match[1] && !map.has(match[1])) map.set(match[1], s);
                }
            }
        }
        return map;
    }, [sessions, tglISO]);

    const filledEquipCountAll = useMemo(
        () => ALL_EQUIPMENT.filter((e) => isEquipFilled(e.id, formValues) || savedEquipMap.has(e.id)).length,
        [formValues, savedEquipMap]
    );

    function resetAll() {
        if (!confirm("Apakah Anda yakin ingin mereset seluruh form input pada area ini? Data yang belum disimpan akan hilang.")) {
            return;
        }
        setFormValues({});
        setCatatanNG({});
        setSelectedGroupId(null);
        setCurrentEquipId(null);
        setShiftStart("");
        setShiftEnd("");
        setStep("area");
        try { window.localStorage.removeItem(draftKey); } catch { /* ignore */ }
        setDraftRestoredAt(null);
        setToast({ type: "warning", message: "Form input dan draft berhasil direset." });
    }

    async function handleSaveEquip(equipId: string) {
        const equip = getEquipmentById(equipId);
        const equipName = equip?.name ?? equipId;

        if (equip && !isEquipComplete(equip, formValues)) {
            setToast({
                type: "warning",
                message: `Lengkapi semua ${equip.items.length} item pemeriksaan ${equipName} sebelum menyimpan.`,
            });
            return;
        }

        const equipNgItems = ngItems.filter((ng) => ng.equipId === equipId).map((ng) => ({
            ...ng,
            kondisiAktual: `Nilai: ${formValues[equipId]?.[ng.itemId] ?? "NG"}`,
            tindakanPerbaikan: catatanNG[`${ng.equipId}_${ng.itemId}`] ?? "",
        }));
        const equipNgsHaveCatatan = equipNgItems.every((ng) => (catatanNG[`${ng.equipId}_${ng.itemId}`] ?? "").trim().length > 0);

        if (equipNgItems.length > 0 && !equipNgsHaveCatatan) {
            setToast({
                type: "warning",
                message: "Isi catatan tindakan perbaikan pada semua item NG sebelum menyimpan.",
            });
            return;
        }

        setIsSaving(true);
        try {
            const score = equip ? calculateEquipScore(equip, formValues).percent : 100;
            const equipVals = { [equipId]: formValues[equipId] };

            const sessionId = `PH-${Date.now()}-${equipId}`;
            const body: InspectionSession = {
                id: sessionId,
                tgl: tglISO,
                shift: shiftStart && shiftEnd ? `${shiftStart}–${shiftEnd}` : "Shift",
                pic: user?.fullName ?? "Admin",
                values: equipVals,
                ngItems: equipNgItems as any,
                scorePercent: score,
                createdAt: new Date().toISOString(),
                equipName: equip?.name,
            };

            // 1. Simpan ke database melalui backend API
            let savedToApi = false;
            let apiErrorMessage = "";
            try {
                const res = await fetch("/e-checksheet-ga/api/powerhouse/inspections/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const resData = await res.json().catch(() => ({}));
                if (res.ok && resData.success !== false) {
                    savedToApi = true;
                } else {
                    apiErrorMessage = resData.message || "Respon server tidak valid";
                }
            } catch (err: any) {
                apiErrorMessage = err?.message || "Tidak dapat terhubung ke server";
                console.warn("Backend API tidak dapat dijangkau, menyimpan ke offline storage:", err);
            }

            // 2. Simpan ke localStorage
            try {
                const existing = JSON.parse(
                    window.localStorage.getItem("echecksheet_ph_sessions") ?? "[]"
                ) as InspectionSession[];
                const filtered = existing.filter((s) => {
                    const match = s.id?.match(/PH-\d+-(.+)$/);
                    const isSameEquip = (match && match[1] === equipId) || (s.values && equipId in s.values);
                    const isSameDay = s.tgl?.slice(0, 10) === tglISO;
                    return !(isSameEquip && isSameDay);
                });
                filtered.unshift(body);
                window.localStorage.setItem("echecksheet_ph_sessions", JSON.stringify(filtered));
            } catch { /* storage error */ }

            // 3. Update sessions state
            setSessions((prev) => {
                const filtered = prev.filter((s) => {
                    const match = s.id?.match(/PH-\d+-(.+)$/);
                    const isSameEquip = (match && match[1] === equipId) || (s.values && equipId in s.values);
                    const isSameDay = s.tgl?.slice(0, 10) === tglISO;
                    return !(isSameEquip && isSameDay);
                });
                return [body, ...filtered];
            });

            // 4. Perbarui draft
            try {
                window.localStorage.setItem(draftKey, JSON.stringify({
                    formValues, catatanNG, shiftStart, shiftEnd, selectedGroupId,
                    savedAt: new Date().toISOString(),
                }));
            } catch { /* storage error */ }

            // 5. Toast
            if (savedToApi) {
                setToast({ type: "success", message: `Inspeksi ${equipName} tersimpan ke database.` });
            } else {
                setToast({ type: "warning", message: `${equipName} tersimpan di penyimpanan lokal (${apiErrorMessage}).` });
            }

            // 6. Kembali ke daftar alat
            setStep("inspection-list");
            setCurrentEquipId(null);
        } catch (error: any) {
            console.error("Gagal menyimpan inspeksi:", error);
            setToast({ type: "error", message: `Gagal menyimpan: ${error?.message || "terjadi kesalahan"}` });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteSession(id: string) {
        try {
            try {
                await fetch(`/e-checksheet-ga/api/powerhouse/inspections/${id}`, { method: "DELETE" });
            } catch {
                console.warn("Gagal menghapus dari server, menghapus dari lokal.");
            }
            const all = JSON.parse(
                window.localStorage.getItem("echecksheet_ph_sessions") ?? "[]"
            ) as InspectionSession[];
            window.localStorage.setItem(
                "echecksheet_ph_sessions",
                JSON.stringify(all.filter((s) => s.id !== id))
            );
            setSessions((prev) => prev.filter((s) => s.id !== id));
        } finally {
            setDeleteConfirmId(null);
        }
    }

    async function handleEditSave(session: InspectionSession) {
        if (!session) return;
        setIsSubmittingEdit(true);

        // 1. Hitung ulang scorePercent dan ngItems berdasarkan nilai terbaru
        const targetEquip = ALL_EQUIPMENT.find((e) => e.id === editTargetEquipId) ||
            ALL_EQUIPMENT.find((e) => e.name === session.equipName || e.id === session.equipName) ||
            ALL_EQUIPMENT.find((e) => Object.keys(session.values || {}).includes(e.id));

        const newNgItems = collectNGItems(session.values);
        const newScore = targetEquip
            ? calculateEquipScore(targetEquip, session.values).percent
            : calculateOverallScore(session.values);

        const updatedSession: InspectionSession = {
            ...session,
            ngItems: newNgItems,
            scorePercent: newScore,
            editedAt: new Date().toISOString(),
        };

        // 2. Backup state sebelumnya untuk rollback jika request gagal (Optimistic UI Update)
        const previousSessions = [...sessions];

        // 3. Update state tabel secara langsung (immutable) agar UI langsung berubah seketika
        setSessions((prev) => prev.map((s) => (s.id === session.id ? updatedSession : s)));
        setEditSession(null);

        try {
            const res = await fetch(`/e-checksheet-ga/api/powerhouse/inspections/${session.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    values: session.values,
                    scorePercent: newScore,
                    ngItems: newNgItems,
                    editedAt: updatedSession.editedAt,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Server error (${res.status})`);
            }

            // 4. Update local storage
            const all = JSON.parse(
                window.localStorage.getItem("echecksheet_ph_sessions") ?? "[]"
            ) as InspectionSession[];
            const updatedAll = all.map((s) => (s.id === session.id ? updatedSession : s));
            window.localStorage.setItem("echecksheet_ph_sessions", JSON.stringify(updatedAll));

            // 5. Trigger Next.js App Router refresh & sinkronisasi data terbaru
            router.refresh();
            await loadHistory();

            setToast({
                type: "success",
                message: `Perubahan sesi inspeksi ${session.equipName || ""} berhasil disimpan. Status & tabel telah diperbarui.`,
            });
        } catch (err: any) {
            console.error("❌ Gagal update sesi inspeksi:", err);
            // Rollback UI ke data sebelum edit jika terjadi kegagalan
            setSessions(previousSessions);
            setToast({
                type: "warning",
                message: `Gagal memperbarui ke server: ${err.message || "Koneksi terputus"}. Perubahan dibatalkan.`,
            });
        } finally {
            setIsSubmittingEdit(false);
        }
    }

    // ─── NG CATEGORY ANALYSIS ─────────────────────────────────────────────────
    function categorizeNG(sessions: InspectionSession[]): Record<string, number> {
        const cats: Record<string, number> = {
            "Suhu Berlebih": 0,
            "Tekanan Abnormal": 0,
            "Voltase/Arus di Luar Standar": 0,
            "Kebocoran/Mekanikal": 0,
            "5S/Kebersihan": 0,
        };
        const tempIds = new Set(["tempRuang", "suhuComp", "suhuKabelAki", "suhuPullAki", "tempTrafo", "tempDewpoint",
            "suhuK21", "suhuF21", "suhuK23", "suhuK22",
            "epcosFiltKabel", "epcosFiltKoneksi", "outFanRadialKabel", "outFanRadialKoneksi",
            "inInverterKabel", "inInverterKoneksi", "outInverterKabel", "outInverterKoneksi",
            "contactorFanRadialKabel", "contactorFanRadialKoneksi"]);
        const pressIds = new Set(["airPressure", "evapPressure", "dpOilSeparator", "pressureGaugeUtama", "frekuensi"]);
        const voltIds = new Set(["voltAki1", "voltAki2", "volt1P", "volt3P", "voltRN", "voltSN", "voltTN",
            "voltRS", "voltST", "voltRT", "powerFactor", "arusR", "arusS", "arusT",
            "arusMotorScrewU", "arusMotorScrewV", "arusMotorScrewW",
            "arusFanBlowerU", "arusFanBlowerV", "arusFanBlowerW"]);
        const leakIds = new Set(["bocorOliMesin", "bocorFilterSolar", "bocorOli", "bocorUdara", "tangkiSolar",
            "motorPompaSolar", "pompaSolar", "pipaSaluran", "kebocoranTrafo",
            "vbeltAlternator", "vbeltUtama", "kondisiKoplingP1", "kondisiKoplingP2", "kondisiKoplingP3",
            "kondisiFisikKarat", "insulasiKabelAki", "markingPullAccu"]);
        const cleanIds = new Set(["kebersihan", "kebersihanRuangan", "filterKondensor", "filterFan", "filterUdaraColor", "coolingFanInverter", "panelBooster"]);

        for (const session of sessions) {
            for (const ng of session.ngItems) {
                if (tempIds.has(ng.itemId)) cats["Suhu Berlebih"]++;
                else if (pressIds.has(ng.itemId)) cats["Tekanan Abnormal"]++;
                else if (voltIds.has(ng.itemId)) cats["Voltase/Arus di Luar Standar"]++;
                else if (leakIds.has(ng.itemId)) cats["Kebocoran/Mekanikal"]++;
                else if (cleanIds.has(ng.itemId)) cats["5S/Kebersihan"]++;
                else cats["Tekanan Abnormal"]++;
            }
        }
        return cats;
    }

    function buildMonthlyTrend(sessions: InspectionSession[]): number[] {
        const counts = Array(12).fill(0);
        for (const s of sessions) {
            const m = new Date(s.createdAt).getMonth();
            counts[m] += s.ngItems.length;
        }
        return counts;
    }

    function goToArea() { setStep("area"); }
    function goToShift() { if (selectedGroupId) setStep("shift"); }
    function goToInspectionList() { if (selectedGroupId && shiftStart && shiftEnd) { setStep("inspection-list"); setCurrentEquipId(null); } }

    function handleSelectArea(groupId: string) {
        setSelectedGroupId(groupId);
        setStep(shiftStart && shiftEnd ? "inspection-list" : "shift");
    }

    function handleOpenEquip(equipId: string) {
        const savedSession = savedEquipMap.get(equipId);
        if (savedSession && (!formValues[equipId] || Object.keys(formValues[equipId] ?? {}).length === 0)) {
            const savedVals = savedSession.values?.[equipId] || (savedSession.values as any) || {};
            if (Object.keys(savedVals).length > 0) {
                setFormValues((prev) => ({ ...prev, [equipId]: { ...savedVals } }));
            }
            if (savedSession.ngItems && savedSession.ngItems.length > 0) {
                setCatatanNG((prev) => {
                    const nextCatatan = { ...prev };
                    for (const ng of savedSession.ngItems) {
                        const key = `${ng.equipId || equipId}_${ng.itemId}`;
                        if (!nextCatatan[key] && (ng as any).tindakanPerbaikan) {
                            nextCatatan[key] = (ng as any).tindakanPerbaikan;
                        }
                    }
                    return nextCatatan;
                });
            }
        }
        setCurrentEquipId(equipId);
        setStep("inspection-item");
    }

    function handleNavEquip(direction: 1 | -1) {
        if (!currentGroup || !currentEquipId) return;
        const idx = currentGroup.equipment.findIndex((e) => e.id === currentEquipId);
        const nextIdx = idx + direction;
        if (nextIdx >= 0 && nextIdx < currentGroup.equipment.length) {
            setCurrentEquipId(currentGroup.equipment[nextIdx].id);
        } else {
            setStep("inspection-list");
        }
    }

    const filteredGroupEquipment = useMemo(() => {
        if (!currentGroup) return [];
        const q = equipSearch.trim().toLowerCase();
        if (!q) return currentGroup.equipment;
        return currentGroup.equipment.filter((e) => e.name.toLowerCase().includes(q));
    }, [currentGroup, equipSearch]);

    const toastBg = toast?.type === "success" ? "#15803d" : toast?.type === "warning" ? "#b45309" : "#b91c1c";

    // ─── RENDER ───────────────────────────────────────────────────────────────

    return (
        <div className="ph">
            <style>{STYLES}</style>
            <Sidebar />
            <main className="ph-main">
                {/* ── HERO ── */}
                <div className="ph-hero">
                    <div className="ph-hero-l">
                        <div className="ph-hero-ico"><Flame size={24} /></div>
                        <div>
                            <h1>E-Checksheet Power House</h1>
                            <p>PT Jatim Autocomp Indonesia · PGA Dept. Utility · {todayStr}</p>
                        </div>
                    </div>
                    <div className="ph-hero-r">
                        <span className="ph-chip">
                            <span className={`ph-dot ${isOnline ? "" : "off"}`} />
                            {isOnline ? "Online" : "Offline"}
                        </span>
                        <span className="ph-chip">PIC: {user?.fullName ?? "—"}</span>
                        {activeTab === "form" && (
                            <span className="ph-hero-ring">
                                <Ring value={filledEquipCountAll} total={ALL_EQUIPMENT.length} size={34} stroke={4} color="#f5a524" track="rgba(255,255,255,.2)" label={false} />
                                {filledEquipCountAll}/{ALL_EQUIPMENT.length} alat terisi
                            </span>
                        )}
                    </div>
                </div>

                {/* ── TABS ── */}
                <div className="ph-tabs" role="tablist">
                    {[
                        { key: "form", label: "Form Input", icon: <ClipboardList size={15} /> },
                        { key: "history", label: "Riwayat Inspeksi", icon: <History size={15} /> },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            role="tab"
                            aria-selected={activeTab === tab.key}
                            className={`ph-tab ${activeTab === tab.key ? "on" : ""}`}
                            onClick={() => setActiveTab(tab.key as "form" | "history")}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ═══════════ TAB: FORM INPUT ═══════════ */}
                {activeTab === "form" && (
                    <div>
                        <WizardSteps
                            step={step}
                            canGoShift={!!selectedGroupId}
                            canGoInspection={!!selectedGroupId && !!shiftStart && !!shiftEnd}
                            onNavigate={(s) => {
                                if (s === "area") goToArea();
                                if (s === "shift") goToShift();
                                if (s === "inspection-list") goToInspectionList();
                            }}
                        />

                        {draftRestoredAt && (
                            <div className="ph-banner">
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <FileCheck2 size={16} />
                                    Draft dipulihkan otomatis (disimpan {new Date(draftRestoredAt).toLocaleTimeString("id-ID")}).
                                </div>
                                <button onClick={resetAll}>Buang draft</button>
                            </div>
                        )}

                        {/* ── STEP 1: PILIH AREA ── */}
                        {step === "area" && (
                            <div>
                                <h2 className="ph-h2">Area mana yang diperiksa?</h2>
                                <p className="ph-sub">Pilih satu sistem untuk mulai inspeksi shift ini.</p>
                                <div className="ph-areas">
                                    {SYSTEM_GROUPS.map((group) => {
                                        const totalEquip = group.equipment.length;
                                        const filledEquip = group.equipment.filter((e) => isEquipFilled(e.id, formValues) || savedEquipMap.has(e.id)).length;
                                        return (
                                            <button
                                                key={group.id}
                                                onClick={() => handleSelectArea(group.id)}
                                                className={`ph-area ${selectedGroupId === group.id ? "sel" : ""}`}
                                                style={{ ["--c" as any]: group.color, ["--bg" as any]: group.bgColor }}
                                            >
                                                <div className="ph-area-top">
                                                    <div className="ph-area-ico">{group.icon}</div>
                                                    <div>
                                                        <div className="ph-area-name">{group.shortName}</div>
                                                        <div className="ph-area-full">{group.name}</div>
                                                    </div>
                                                </div>
                                                <div className="ph-area-foot">
                                                    <span className="ph-area-count"><b>{filledEquip}/{totalEquip}</b> alat terisi</span>
                                                    <div className="ph-segbar">
                                                        {group.equipment.map((e, i) => (
                                                            <span key={e.id} className={`ph-seg ${i < filledEquip ? "f" : ""}`} />
                                                        ))}
                                                    </div>
                                                    <ChevronRight size={18} color={group.color} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: JAM SHIFT ── */}
                        {step === "shift" && currentGroup && (
                            <div style={{ maxWidth: 580 }}>
                                <button className="ph-back" onClick={goToArea}><ChevronLeft size={15} /> Ganti area</button>
                                <div className="ph-card" style={{ borderTop: `5px solid ${currentGroup.color}` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div className="ph-gico" style={{ background: currentGroup.color }}><Clock size={18} /></div>
                                        <div>
                                            <h2 className="ph-h2">Rentang jam shift</h2>
                                            <p className="ph-sub" style={{ marginTop: 1 }}>{currentGroup.name}</p>
                                        </div>
                                    </div>

                                    <div className="ph-presets">
                                        {SHIFT_PRESETS.map((p) => (
                                            <button
                                                key={p.label}
                                                onClick={() => { setShiftStart(p.start); setShiftEnd(p.end); }}
                                                className={`ph-pill-btn ${shiftStart === p.start && shiftEnd === p.end ? "on" : ""}`}
                                            >
                                                {p.label} · {p.start}–{p.end}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="ph-timerow">
                                        <div className="ph-field">
                                            <label>Jam mulai</label>
                                            <input type="time" className="ph-input" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} />
                                        </div>
                                        <span style={{ color: "var(--mist)", paddingBottom: 10 }}>sampai</span>
                                        <div className="ph-field">
                                            <label>Jam selesai</label>
                                            <input type="time" className="ph-input" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} />
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                                        <button className="ph-btn" onClick={goToInspectionList} disabled={!shiftStart || !shiftEnd}>
                                            Mulai inspeksi <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3a: DAFTAR ALAT ── */}
                        {step === "inspection-list" && currentGroup && (
                            <div>
                                <div className="ph-listhead">
                                    <div>
                                        <button className="ph-back" onClick={goToArea}><ChevronLeft size={15} /> Ganti area</button>
                                        <div className="ph-gtitle">
                                            <div className="ph-gico" style={{ background: currentGroup.color }}>{currentGroup.icon}</div>
                                            <div>
                                                <h2 className="ph-h2">{currentGroup.name}</h2>
                                                <p className="ph-sub" style={{ marginTop: 1 }}>
                                                    Shift {shiftStart}–{shiftEnd} · {currentGroup.equipment.length} alat
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="ph-btn ghost sm" onClick={() => setStep("shift")}>
                                        <Clock size={14} /> Ubah jam shift
                                    </button>
                                </div>

                                <div className="ph-search">
                                    <Search size={15} />
                                    <input type="text" placeholder="Cari alat..." value={equipSearch} onChange={(e) => setEquipSearch(e.target.value)} />
                                </div>

                                <div className="ph-equips">
                                    {filteredGroupEquipment.map((equip) => {
                                        const isSavedToday = savedEquipMap.has(equip.id);
                                        const savedSession = savedEquipMap.get(equip.id);
                                        const filled = isEquipFilled(equip.id, formValues);
                                        const complete = isEquipComplete(equip, formValues);
                                        const equipHasNG = equip.items.some((item) => {
                                            const v = formValues[equip.id]?.[item.id] ?? "";
                                            return v && isItemNG(item, v);
                                        });
                                        const savedHasNG = !!(savedSession?.ngItems && savedSession.ngItems.length > 0);
                                        const hasNG = equipHasNG || savedHasNG;
                                        const done = isSavedToday ? equip.items.length : filledItemCount(equip, formValues);
                                        const stripe = hasNG ? "#dc2626" : isSavedToday ? "#16a34a" : complete ? "#2563eb" : filled ? "#f5a524" : "#d5dce6";
                                        return (
                                            <button
                                                key={equip.id}
                                                onClick={() => handleOpenEquip(equip.id)}
                                                className="ph-eq"
                                                style={{ ["--st" as any]: stripe, background: hasNG ? "#fff7f7" : "#fff" }}
                                            >
                                                <Ring
                                                    value={done}
                                                    total={equip.items.length}
                                                    size={46}
                                                    stroke={5}
                                                    color={hasNG ? "#dc2626" : isSavedToday ? "#16a34a" : currentGroup.color}
                                                />
                                                <div className="ph-eq-body">
                                                    <div className="ph-eq-name">{equip.name}</div>
                                                    <div className="ph-eq-meta">
                                                        {done}/{equip.items.length} item
                                                        {isSavedToday && savedSession ? ` · ${savedSession.shift} · ${savedSession.scorePercent}% OK` : ""}
                                                    </div>
                                                    {hasNG ? (
                                                        <span className="ph-tag ng"><AlertTriangle size={12} /> Ada temuan NG</span>
                                                    ) : isSavedToday ? (
                                                        <span className="ph-tag ok"><CheckCircle2 size={12} /> Tersimpan</span>
                                                    ) : complete ? (
                                                        <span className="ph-tag info"><CheckCircle2 size={12} /> Siap disimpan</span>
                                                    ) : filled ? (
                                                        <span className="ph-tag warn">Sebagian</span>
                                                    ) : (
                                                        <span className="ph-tag none">Belum diisi</span>
                                                    )}
                                                </div>
                                                <ChevronRight size={16} color={currentGroup.color} />
                                            </button>
                                        );
                                    })}
                                    {filteredGroupEquipment.length === 0 && (
                                        <div className="ph-empty" style={{ gridColumn: "1 / -1" }}>
                                            <b>Alat tidak ditemukan</b>Coba kata kunci lain.
                                        </div>
                                    )}
                                </div>

                                {ngItems.length > 0 && (
                                    <div className="ph-alert">
                                        <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <div style={{ flex: 1 }}>
                                            <div className="ph-alert-t">{ngItems.length} item abnormal (NG) terdeteksi di seluruh area</div>
                                            <div className="ph-alert-chips">
                                                {ngItems.map((ng) => (
                                                    <span key={`${ng.equipId}_${ng.itemId}`} className="ph-alert-chip">{ng.label}</span>
                                                ))}
                                            </div>
                                            {!allNGHaveCatatan && (
                                                <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
                                                    Isi catatan tindakan perbaikan untuk setiap item NG di alat terkait sebelum menyimpan.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button className="ph-btn ghost" onClick={resetAll}>
                                        <RefreshCw size={14} /> Reset semua form area
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3b: FORM ITEM PER ALAT ── */}
                        {step === "inspection-item" && currentEquip && currentEquipGroup && (() => {
                            const filledN = filledItemCount(currentEquip, formValues);
                            const totalN = currentEquip.items.length;
                            const equipNG = ngItems.filter((n) => n.equipId === currentEquip.id).length;
                            const complete = isEquipComplete(currentEquip, formValues);
                            const isSaved = savedEquipMap.has(currentEquip.id);
                            return (
                                <div className="ph-panel" style={{ ["--c" as any]: currentEquipGroup.color, ["--bg" as any]: currentEquipGroup.bgColor }}>
                                    <div className="ph-panel-h">
                                        <div>
                                            <button className="ph-back" style={{ marginBottom: 6 }} onClick={() => setStep("inspection-list")}>
                                                <ChevronLeft size={14} /> Kembali ke daftar alat
                                            </button>
                                            <div className="ph-panel-title">
                                                {currentEquip.name}
                                                {isSaved && <span className="ph-saved-badge"><CheckCircle2 size={12} /> Sudah disimpan hari ini</span>}
                                            </div>
                                            <div className="ph-panel-sub">{currentEquipGroup.name} · {totalN} item pemeriksaan</div>
                                        </div>
                                        <button
                                            className="ph-quick"
                                            onClick={() => handleQuickFillNormal(currentEquip)}
                                            title="Isi semua item toggle yang masih kosong dengan Normal (O)"
                                        >
                                            <Wand2 size={14} /> Isi cepat Normal (O)
                                        </button>
                                    </div>

                                    <div className="ph-prog">
                                        <div className="ph-prog-bar">
                                            <div className="ph-prog-fill" style={{ width: `${(filledN / totalN) * 100}%` }} />
                                        </div>
                                        <span className="ph-prog-txt"><b>{filledN}/{totalN}</b> terisi</span>
                                        {equipNG > 0 ? (
                                            <span className="ph-st ng"><AlertTriangle size={12} /> {equipNG} NG</span>
                                        ) : filledN > 0 ? (
                                            <span className="ph-st ok"><Check size={12} /> Tidak ada NG</span>
                                        ) : null}
                                    </div>

                                    <div className="ph-tw">
                                        <table className="ph-t">
                                            <thead>
                                                <tr>
                                                    <th style={{ paddingLeft: 18 }}>No</th>
                                                    <th>Item pemeriksaan</th>
                                                    <th>Standar</th>
                                                    <th>Nilai / status</th>
                                                    <th>Hasil</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentEquip.items.map((item, idx) => {
                                                    const value = getItemValue(currentEquip.id, item.id);
                                                    const ng = value !== "" && isItemNG(item, value);
                                                    const ngKey = `${currentEquip.id}_${item.id}`;
                                                    const noteVal = catatanNG[ngKey] ?? "";
                                                    return (
                                                        <React.Fragment key={item.id}>
                                                            <tr className={`row ${ng ? "ng" : value !== "" ? "okrow" : ""}`}>
                                                                <td className="no"><span className="ph-num">{idx + 1}</span></td>
                                                                <td style={{ minWidth: 200 }}>
                                                                    <span className="ph-item-l">{item.label}</span>
                                                                    {item.unit && <span className="ph-item-u">{item.unit}</span>}
                                                                </td>
                                                                <td>
                                                                    {item.helperText
                                                                        ? <span className="ph-std">{item.helperText}</span>
                                                                        : <span className="ph-std none">—</span>}
                                                                </td>
                                                                <td style={{ minWidth: 200 }}>
                                                                    {item.type === "toggle" && (
                                                                        <ToggleCell value={value} onChange={(v) => handleItemChange(currentEquip.id, item.id, v)} />
                                                                    )}
                                                                    {item.type === "dropdown" && (
                                                                        <DropdownCell
                                                                            value={value}
                                                                            bad={ng}
                                                                            options={item.options ?? []}
                                                                            onChange={(v) => handleItemChange(currentEquip.id, item.id, v)}
                                                                        />
                                                                    )}
                                                                    {item.type === "number" && (
                                                                        <div className="ph-field-in">
                                                                            <input
                                                                                type="number"
                                                                                inputMode="decimal"
                                                                                className={ng ? "bad" : ""}
                                                                                value={value}
                                                                                placeholder={item.placeholder ?? "0"}
                                                                                onChange={(e) => handleItemChange(currentEquip.id, item.id, e.target.value)}
                                                                            />
                                                                            {item.unit && <span className="ph-unit">{item.unit}</span>}
                                                                        </div>
                                                                    )}
                                                                    {item.type === "time" && (
                                                                        <input
                                                                            type="time"
                                                                            className="ph-input"
                                                                            value={value}
                                                                            onChange={(e) => handleItemChange(currentEquip.id, item.id, e.target.value)}
                                                                        />
                                                                    )}
                                                                    {item.type === "text" && (
                                                                        <div className="ph-field-in">
                                                                            <input
                                                                                type="text"
                                                                                className="plain"
                                                                                value={value}
                                                                                placeholder={item.placeholder ?? ""}
                                                                                onChange={(e) => handleItemChange(currentEquip.id, item.id, e.target.value)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ width: 96 }}>
                                                                    {value === "" ? (
                                                                        <span className="ph-st idle">Kosong</span>
                                                                    ) : ng ? (
                                                                        <span className="ph-st ng"><X size={12} /> NG</span>
                                                                    ) : (
                                                                        <span className="ph-st ok"><Check size={12} /> OK</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            {ng && (
                                                                <tr className="note">
                                                                    <td colSpan={5}>
                                                                        <div className="ph-note">
                                                                            <span className="ph-note-l"><Edit3 size={13} /> Tindakan perbaikan</span>
                                                                            <textarea
                                                                                rows={2}
                                                                                className={noteVal.trim() ? "has" : ""}
                                                                                value={noteVal}
                                                                                onChange={(e) => setCatatanNG((prev) => ({ ...prev, [ngKey]: e.target.value }))}
                                                                                placeholder="Wajib diisi: apa yang akan dilakukan untuk memperbaiki temuan ini?"
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* ─── Catatan / Keterangan Tambahan ─── */}
                                    <div className="ph-catatan-box">
                                        <div className="ph-catatan-box-t">
                                            <Edit3 size={14} /> Catatan / Keterangan Tambahan Alat (Opsional)
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={getItemValue(currentEquip.id, "catatan")}
                                            onChange={(e) => handleItemChange(currentEquip.id, "catatan", e.target.value)}
                                            placeholder="Masukkan catatan kondisi alat, rekomendasi, atau temuan observasi tambahan..."
                                        />
                                    </div>

                                    <div className="ph-foot">
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button className="ph-btn ghost sm" onClick={() => handleNavEquip(-1)}>
                                                <ChevronLeft size={15} /> Sebelumnya
                                            </button>
                                            <button className="ph-btn ghost sm" onClick={() => handleNavEquip(1)}>
                                                Berikutnya <ChevronRight size={15} />
                                            </button>
                                        </div>
                                        <button
                                            className="ph-save"
                                            onClick={() => handleSaveEquip(currentEquip.id)}
                                            disabled={isSaving || !complete}
                                            title={!complete ? "Isi semua baris pemeriksaan sebelum menyimpan" : "Simpan data ke database"}
                                            style={{ background: !complete ? "#b5c0cf" : isSaved ? "#0284c7" : "#16a34a", opacity: isSaving ? 0.7 : 1 }}
                                        >
                                            {isSaving ? <Loader2 size={16} className="ph-spin" /> : <Save size={16} />}
                                            {isSaving ? "Menyimpan..." : isSaved ? "Perbarui & simpan ulang" : "Simpan alat ini"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* ═══════════ TAB: HISTORY ═══════════ */}
                {activeTab === "history" && (
                    <div>
                        <div className="ph-filters">
                            <div className="ph-select">
                                <select value={historyYear} onChange={(e) => setHistoryYear(Number(e.target.value))} style={{ minWidth: 100 }}>
                                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown size={14} />
                            </div>
                            <div className="ph-select">
                                <select value={historyMonth} onChange={(e) => setHistoryMonth(Number(e.target.value))} style={{ minWidth: 150 }}>
                                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <ChevronDown size={14} />
                            </div>
                            <button className="ph-btn ghost sm" onClick={loadHistory}>
                                <RefreshCw size={14} className={isLoadingHistory ? "ph-spin" : ""} /> Muat ulang
                            </button>
                        </div>

                        {isLoadingHistory ? (
                            <div style={{ textAlign: "center", padding: 56 }}>
                                <Loader2 size={30} color="#1b2d47" className="ph-spin" />
                            </div>
                        ) : (
                            <>
                                {sessions.length > 0 && (() => {
                                    const avgScore = Math.round(sessions.reduce((sum, s) => sum + s.scorePercent, 0) / sessions.length);
                                    const totalNG = sessions.reduce((sum, s) => sum + s.ngItems.length, 0);
                                    return (
                                        <div className="ph-kpis">
                                            <div className="ph-kpi" style={{ ["--k" as any]: "#16a34a" }}>
                                                <div className="ph-kpi-l">Rata-rata skor OK</div>
                                                <div className="ph-kpi-v">{avgScore}%</div>
                                            </div>
                                            <div className="ph-kpi" style={{ ["--k" as any]: "#1b2d47" }}>
                                                <div className="ph-kpi-l">Total sesi</div>
                                                <div className="ph-kpi-v">{sessions.length}</div>
                                            </div>
                                            <div className="ph-kpi" style={{ ["--k" as any]: totalNG > 0 ? "#dc2626" : "#16a34a" }}>
                                                <div className="ph-kpi-l">Total temuan NG</div>
                                                <div className="ph-kpi-v">{totalNG}</div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {sessions.length > 0 && (() => {
                                    const cats = categorizeNG(sessions);
                                    const catColors: Record<string, string> = {
                                        "Suhu Berlebih": "#f97316",
                                        "Tekanan Abnormal": "#3b82f6",
                                        "Voltase/Arus di Luar Standar": "#a855f7",
                                        "Kebocoran/Mekanikal": "#ef4444",
                                        "5S/Kebersihan": "#22c55e",
                                    };
                                    const maxCat = Math.max(...Object.values(cats), 1);
                                    const trend = buildMonthlyTrend(sessions);
                                    const maxVal = Math.max(...trend, 1);
                                    const barW = 22, gap = 12, chartH = 110;
                                    return (
                                        <div className="ph-grid2">
                                            <div className="ph-box">
                                                <div className="ph-box-t">Temuan NG per kategori</div>
                                                {Object.entries(cats).map(([cat, count]) => (
                                                    <div className="ph-cat" key={cat}>
                                                        <span className="ph-cat-l">{cat}</span>
                                                        <div className="ph-cat-bar">
                                                            <div className="ph-cat-fill" style={{ width: `${(count / maxCat) * 100}%`, background: catColors[cat] }} />
                                                        </div>
                                                        <span className="ph-cat-n" style={{ color: count > 0 ? catColors[cat] : "#94a3b8" }}>{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="ph-box">
                                                <div className="ph-box-t">Tren temuan NG bulanan {historyYear}</div>
                                                <div style={{ overflowX: "auto" }}>
                                                    <svg className="ph-bars" width={12 * (barW + gap) + 20} height={chartH + 34} style={{ display: "block" }}>
                                                        {[0.25, 0.5, 0.75, 1].map((f) => (
                                                            <line key={f} x1={0} x2={12 * (barW + gap) + 20} y1={chartH - chartH * f} y2={chartH - chartH * f} stroke="#eef1f5" />
                                                        ))}
                                                        {trend.map((val, i) => {
                                                            const barH = val === 0 ? 3 : Math.max(8, Math.round((val / maxVal) * (chartH - 14)));
                                                            const x = 10 + i * (barW + gap);
                                                            const y = chartH - barH;
                                                            const current = i === historyMonth;
                                                            return (
                                                                <g key={i}>
                                                                    <title>{MONTHS[i]}: {val} temuan NG</title>
                                                                    <rect x={x} y={y} width={barW} height={barH} rx={6}
                                                                        fill={val === 0 ? "#e5eaf1" : current ? "#f5a524" : "#1b2d47"} />
                                                                    {val > 0 && <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">{val}</text>}
                                                                    <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize={10} fill={current ? "#0e1a2b" : "#94a3b8"} fontWeight={current ? 800 : 500}>
                                                                        {MONTHS[i].slice(0, 3)}
                                                                    </text>
                                                                </g>
                                                            );
                                                        })}
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* History Table */}
                                <div className="ph-ht-card">
                                    <div className="ph-ht-head">Daftar sesi inspeksi <span>{sessions.length}</span></div>
                                    {sessions.length === 0 ? (
                                        <div className="ph-empty">
                                            <b>Belum ada inspeksi di {MONTHS[historyMonth]} {historyYear}</b>
                                            Simpan inspeksi pertama dari tab Form Input, riwayatnya muncul di sini.
                                        </div>
                                    ) : (
                                        <div className="ph-tw">
                                            <table className="ph-t">
                                                <thead>
                                                    <tr>
                                                        {["Tanggal", "Shift", "Alat / area", "PIC", "Skor OK", "Temuan", "Dicatat", "Aksi"].map((h) => (
                                                            <th key={h}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sessions.map((session) => {
                                                        const tone = scoreTone(session.scorePercent, session.ngItems.length > 0);
                                                        const toneColor = { ng: "#dc2626", ok: "#16a34a", mid: "#2563eb", low: "#d99a00", none: "#94a3b8" }[tone];
                                                        return (
                                                            <tr key={session.id} className={`row ${session.ngItems.length > 0 ? "ng" : ""}`}>
                                                                <td className="no" style={{ width: "auto", minWidth: 110 }}>
                                                                    <div className="ph-date">{new Date(session.tgl).toLocaleDateString("id-ID")}</div>
                                                                </td>
                                                                <td><span className="ph-std">{session.shift}</span></td>
                                                                <td style={{ fontWeight: 700, fontSize: 13, minWidth: 160 }}>
                                                                    {session.equipName ? session.equipName : "Semua area"}
                                                                </td>
                                                                <td>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                        <span className="ph-av">{(session.pic || "?").trim().charAt(0).toUpperCase()}</span>
                                                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{session.pic}</span>
                                                                        {session.editedAt && <span className="ph-tag warn" style={{ marginTop: 0 }}>Diedit</span>}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="ph-score">
                                                                        <div className="ph-score-bar">
                                                                            <div className="ph-score-fill" style={{ width: `${session.scorePercent}%`, background: toneColor }} />
                                                                        </div>
                                                                        <span className="ph-score-v" style={{ color: toneColor }}>{session.scorePercent}%</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {session.ngItems.length > 0 ? (
                                                                        <span className="ph-st ng"><AlertTriangle size={12} /> {session.ngItems.length} NG</span>
                                                                    ) : (
                                                                        <span className="ph-st ok"><Check size={12} /> Normal</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <div className="ph-time">{new Date(session.createdAt).toLocaleString("id-ID")}</div>
                                                                </td>
                                                                <td>
                                                                    <div className="ph-act">
                                                                        <button className="ph-ibtn" onClick={() => setDetailSession(session)}><Info size={13} /> Detail</button>
                                                                        <button
                                                                            className="ph-ibtn edit"
                                                                            onClick={() => {
                                                                                // Deteksi target peralatan spesifik (misal: "MAIN-PANEL" / Main Panel Distribusi ACB)
                                                                                const target = ALL_EQUIPMENT.find(
                                                                                    (e) => e.name === session.equipName || e.id === session.equipName
                                                                                ) || ALL_EQUIPMENT.find((e) => Object.keys(session.values || {}).includes(e.id));
                                                                                handleOpenEditModal(session, target?.id);
                                                                            }}
                                                                        >
                                                                            <Edit3 size={13} /> Edit
                                                                        </button>
                                                                        <button className="ph-ibtn del" aria-label="Hapus sesi" onClick={() => setDeleteConfirmId(session.id)}><Trash2 size={13} /></button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* ═══════════ MODAL: DETAIL ═══════════ */}
            {detailSession && (
                <ModalOverlay onClose={() => setDetailSession(null)}>
                    <div className="ph-sheet" style={{ width: "min(96vw, 720px)" }}>
                        <div className="ph-sheet-h">
                            <div>
                                <h2 className="ph-h2">Detail sesi</h2>
                                <p className="ph-sub">{new Date(detailSession.tgl).toLocaleDateString("id-ID")} · {detailSession.shift}</p>
                            </div>
                            <button className="ph-x" onClick={() => setDetailSession(null)} aria-label="Tutup"><X size={18} /></button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                            <InfoRow label="PIC" value={detailSession.pic} />
                            <InfoRow label="Skor" value={`${detailSession.scorePercent}% OK`} />
                            <InfoRow label="Waktu catat" value={new Date(detailSession.createdAt).toLocaleString("id-ID")} />
                            {detailSession.editedAt && <InfoRow label="Terakhir diedit" value={new Date(detailSession.editedAt).toLocaleString("id-ID")} />}
                        </div>
                        {detailSession.ngItems.length > 0 ? (
                            <div className="ph-alert" style={{ marginBottom: 12 }}>
                                <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                                <div style={{ width: "100%" }}>
                                    <div className="ph-alert-t" style={{ marginBottom: 6 }}>Temuan NG</div>
                                    {detailSession.ngItems.map((ng) => (
                                        <div key={`${ng.equipId}_${ng.itemId}`} style={{ fontSize: 12.5, color: "#7f1d1d", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                            <span>
                                                {ng.label} <span style={{ opacity: 0.6, fontFamily: "var(--mono)", fontSize: 11 }}>({ng.equipId})</span>
                                            </span>
                                            <button
                                                className="ph-ibtn edit"
                                                style={{ padding: "3px 8px", fontSize: 11, background: "#fee2e2" }}
                                                onClick={() => {
                                                    const s = detailSession;
                                                    setDetailSession(null);
                                                    handleOpenEditModal(s, ng.equipId);
                                                }}
                                            >
                                                <Edit3 size={11} /> Edit Item Ini
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginBottom: 12 }}><span className="ph-st ok"><Check size={12} /> Semua item normal</span></div>
                        )}

                        {/* Catatan Per Alat */}
                        {(() => {
                            const notes = ALL_EQUIPMENT.map((eq) => ({
                                id: eq.id,
                                name: eq.name,
                                note: detailSession.values?.[eq.id]?.catatan?.trim() || "",
                            })).filter((x) => x.note);

                            if (notes.length === 0) return null;

                            return (
                                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--steel)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                                        <Edit3 size={13} /> Catatan Pemeriksaan Alat
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {notes.map((n, i) => (
                                            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", fontSize: 12.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                                <div>
                                                    <span style={{ fontWeight: 600, color: "var(--navy)", marginRight: 6 }}>{n.name}:</span>
                                                    <span style={{ color: "var(--text)" }}>{n.note}</span>
                                                </div>
                                                <button
                                                    className="ph-ibtn edit"
                                                    style={{ padding: "3px 8px", fontSize: 11 }}
                                                    onClick={() => {
                                                        const s = detailSession;
                                                        setDetailSession(null);
                                                        handleOpenEditModal(s, n.id);
                                                    }}
                                                >
                                                    <Edit3 size={11} /> Edit
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                            <button className="ph-btn ghost" onClick={() => setDetailSession(null)}>Tutup</button>
                            <button
                                className="ph-btn"
                                onClick={() => {
                                    const s = detailSession;
                                    const target = ALL_EQUIPMENT.find(
                                        (e) => e.name === s.equipName || e.id === s.equipName
                                    ) || ALL_EQUIPMENT.find((e) => Object.keys(s.values || {}).includes(e.id));
                                    setDetailSession(null);
                                    handleOpenEditModal(s, target?.id);
                                }}
                            >
                                <Edit3 size={14} /> Edit Sesi Ini
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* ═══════════ MODAL: EDIT (TARGETED EDIT FORM) ═══════════ */}
            {editSession && (() => {
                const targetEquipObj = ALL_EQUIPMENT.find((e) => e.id === editTargetEquipId);
                const displayedEquipment = editTargetEquipId && !showAllInEdit
                    ? ALL_EQUIPMENT.filter((e) => e.id === editTargetEquipId)
                    : ALL_EQUIPMENT;

                return (
                    <ModalOverlay onClose={() => { setEditSession(null); setEditTargetEquipId(null); }}>
                        <div className="ph-sheet" style={{ width: "min(96vw, 780px)" }}>
                            <div className="ph-sheet-h">
                                <div>
                                    <h2 className="ph-h2">
                                        {targetEquipObj && !showAllInEdit ? `Edit: ${targetEquipObj.name}` : "Edit Sesi Inspeksi"}
                                    </h2>
                                    <p className="ph-sub">
                                        {new Date(editSession.tgl).toLocaleDateString("id-ID")} · Shift {editSession.shift}
                                        {editSession.pic ? ` · PIC: ${editSession.pic}` : ""}
                                    </p>
                                </div>
                                <button
                                    className="ph-x"
                                    onClick={() => { setEditSession(null); setEditTargetEquipId(null); }}
                                    aria-label="Tutup"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Banner Target Spesifik */}
                            {targetEquipObj && (
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 14px",
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: 8,
                                    marginBottom: 16,
                                    flexWrap: "wrap",
                                    gap: 8,
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <Zap size={16} color="#2563eb" />
                                        <span style={{ fontSize: 13, color: "#1e40af", fontWeight: 600 }}>
                                            Form Aktif: <strong>{targetEquipObj.name}</strong>
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="ph-ibtn"
                                        style={{ background: "#fff", fontSize: 11.5, padding: "4px 10px" }}
                                        onClick={() => setShowAllInEdit((prev) => !prev)}
                                    >
                                        {showAllInEdit ? `Tampilkan Hanya ${targetEquipObj.name}` : "Tampilkan Semua Alat"}
                                    </button>
                                </div>
                            )}

                            {displayedEquipment.map((equip) => {
                                const equipVals = editSession.values[equip.id] ?? {};
                                const isTarget = equip.id === editTargetEquipId;
                                return (
                                    <details
                                        key={equip.id}
                                        className="ph-det"
                                        open={Boolean(isTarget || displayedEquipment.length === 1 || showAllInEdit)}
                                    >
                                        <summary style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <span>{equip.name}</span>
                                            {isTarget && (
                                                <span style={{ fontSize: 11, background: "#2563eb", color: "#fff", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                                                    Target Edit
                                                </span>
                                            )}
                                        </summary>
                                        <div style={{ paddingBottom: 8, paddingTop: 4 }}>
                                            {equip.items.map((item) => (
                                                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9, flexWrap: "wrap" }}>
                                                    <span style={{ fontSize: 12.5, color: "var(--steel)", fontWeight: 600, minWidth: 200 }}>
                                                        {item.label}
                                                    </span>
                                                    {item.type === "toggle" && (
                                                        <ToggleCell
                                                            value={equipVals[item.id] ?? ""}
                                                            onChange={(v) => setEditSession((prev) => prev ? {
                                                                ...prev,
                                                                values: { ...prev.values, [equip.id]: { ...(prev.values[equip.id] ?? {}), [item.id]: v } },
                                                            } : null)}
                                                        />
                                                    )}
                                                    {item.type === "dropdown" && (
                                                        <DropdownCell
                                                            value={equipVals[item.id] ?? ""}
                                                            options={item.options ?? []}
                                                            onChange={(v) => setEditSession((prev) => prev ? {
                                                                ...prev,
                                                                values: { ...prev.values, [equip.id]: { ...(prev.values[equip.id] ?? {}), [item.id]: v } },
                                                            } : null)}
                                                        />
                                                    )}
                                                    {(item.type === "number" || item.type === "text" || item.type === "time") && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                            <input
                                                                className="ph-input"
                                                                type={item.type === "number" ? "number" : item.type === "time" ? "time" : "text"}
                                                                value={equipVals[item.id] ?? ""}
                                                                onChange={(e) => setEditSession((prev) => prev ? {
                                                                    ...prev,
                                                                    values: { ...prev.values, [equip.id]: { ...(prev.values[equip.id] ?? {}), [item.id]: e.target.value } },
                                                                } : null)}
                                                                style={{ width: 150, padding: "7px 10px", fontSize: 13 }}
                                                            />
                                                            {item.unit && <span style={{ fontSize: 12, color: "var(--steel)" }}>{item.unit}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Catatan Alat pada Edit Modal */}
                                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
                                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--steel)", display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                                                    <Edit3 size={13} /> Catatan / Keterangan Alat:
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    className="ph-input"
                                                    style={{ width: "100%", padding: "7px 10px", fontSize: 12.5, resize: "vertical", fontFamily: "inherit" }}
                                                    value={equipVals.catatan ?? ""}
                                                    onChange={(e) => setEditSession((prev) => prev ? {
                                                        ...prev,
                                                        values: {
                                                            ...prev.values,
                                                            [equip.id]: { ...(prev.values[equip.id] ?? {}), catatan: e.target.value }
                                                        }
                                                    } : null)}
                                                    placeholder="Catatan tambahan alat..."
                                                />
                                            </div>
                                        </div>
                                    </details>
                                );
                            })}

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                                <button
                                    className="ph-btn ghost"
                                    disabled={isSubmittingEdit}
                                    onClick={() => { setEditSession(null); setEditTargetEquipId(null); }}
                                >
                                    Batal
                                </button>
                                <button
                                    className="ph-btn"
                                    disabled={isSubmittingEdit}
                                    onClick={() => handleEditSave(editSession)}
                                >
                                    {isSubmittingEdit ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" /> Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={15} /> Simpan perubahan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </ModalOverlay>
                );
            })()}

            {/* ═══════════ MODAL: HAPUS ═══════════ */}
            {deleteConfirmId && (
                <ModalOverlay onClose={() => setDeleteConfirmId(null)}>
                    <div className="ph-sheet" style={{ width: "min(96vw, 420px)", textAlign: "center" }}>
                        <div style={{ width: 56, height: 56, background: "var(--ng-bg)", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
                            <Trash2 size={24} color="#dc2626" />
                        </div>
                        <h3 className="ph-h2" style={{ marginBottom: 6 }}>Hapus sesi inspeksi?</h3>
                        <p className="ph-sub" style={{ marginBottom: 20 }}>Data yang dihapus tidak bisa dikembalikan.</p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                            <button className="ph-btn ghost" onClick={() => setDeleteConfirmId(null)}>Batal</button>
                            <button className="ph-btn" style={{ background: "#dc2626" }} onClick={() => handleDeleteSession(deleteConfirmId)}>
                                Ya, hapus
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* ═══════════ TOAST ═══════════ */}
            {toast && (
                <div className="ph-toast" style={{ background: toastBg }} role="status">
                    {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <div style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</div>
                    <button
                        onClick={() => setToast(null)}
                        aria-label="Tutup notifikasi"
                        style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 2, display: "flex", opacity: 0.8 }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}