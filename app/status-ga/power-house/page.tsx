"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Zap,
    Wind,
    Flame,
    Shield,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    AlertCircle,
    Save,
    Eye,
    Trash2,
    Edit3,
    X,
    ChevronDown,
    RefreshCw,
    Info,
    ClipboardList,
    History,
    Loader2,
    MapPin,
    Clock,
    Wand2,
    Search,
    FileCheck2,
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
    freq: string;
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
}

// ─── MASTER DATA ─────────────────────────────────────────────────────────────

const SYSTEM_GROUPS: SystemGroup[] = [
    {
        id: "GEN_FUEL",
        name: "Sistem Generator & Bahan Bakar",
        shortName: "GENSET & FUEL",
        icon: <Zap size={20} />,
        color: "#b45309",
        bgColor: "#fffbeb",
        borderColor: "#fbbf24",
        equipment: [
            {
                id: "GENSET-01",
                name: "Genset",
                freq: "FC 5",
                items: [
                    { id: "tempRuang", label: "Temperatur Ruangan", type: "number", unit: "°C", ngRule: (v) => Number(v) > 40, helperText: "Standar: ≤ 40°C" },
                    { id: "airAccu", label: "Air Accu", type: "dropdown", options: ["Hijau", "Kuning", "Merah"], ngRule: (v) => v !== "Hijau", helperText: "Hijau = OK" },
                    { id: "airRadiator", label: "Air Radiator", type: "dropdown", options: ["Normal (Antara Up-Low)", "Kurang"], ngRule: (v) => v !== "Normal (Antara Up-Low)", helperText: "Normal = antara batas Up-Low" },
                    { id: "oliMesin", label: "Oli Mesin", type: "dropdown", options: ["Normal (Antara Up-Low)", "Kurang"], ngRule: (v) => v !== "Normal (Antara Up-Low)" },
                    { id: "bocorOliMesin", label: "Kebocoran Oli Mesin", type: "toggle", helperText: "O = Tidak bocor, X = Bocor (NG)" },
                    { id: "bocorFilterSolar", label: "Kebocoran Filter Solar", type: "toggle", helperText: "O = Tidak bocor, X = Bocor (NG)" },
                    { id: "vbeltAlternator", label: "V-Belt Alternator", type: "toggle", helperText: "O = Kencang/Bagus, X = Aus/Kendor (NG)" },
                    { id: "vbeltUtama", label: "V-Belt Utama", type: "toggle", helperText: "O = Kencang/Bagus, X = Aus/Kendor (NG)" },
                    { id: "runningHours", label: "Running Hours", type: "number", unit: "jam", placeholder: "Baca hour meter" },
                    { id: "markingPullAccu", label: "Marking Pull Accu", type: "toggle", helperText: "O = Tanda lurus & kencang, X = Geser/Kendor (NG)" },
                    { id: "insulasiKabelAki", label: "Insulasi Kabel Aki", type: "toggle", helperText: "O = Mulus, X = Rusak/Gores (NG)" },
                    { id: "suhuKabelAki", label: "Suhu Kabel Aki", type: "number", unit: "°C", ngRule: (v) => Number(v) > 31 || Number(v) < 29, helperText: "Standar: 29–31°C" },
                    { id: "suhuPullAki", label: "Suhu Pull Aki", type: "number", unit: "°C", ngRule: (v) => Number(v) > 31 || Number(v) < 29, helperText: "Standar: 29–31°C" },
                    { id: "voltAki1", label: "Voltase Aki 1", type: "number", unit: "V", ngRule: (v) => Number(v) < 12.0, helperText: "Standar: ≥ 12.0 V" },
                    { id: "voltAki2", label: "Voltase Aki 2", type: "number", unit: "V", ngRule: (v) => Number(v) < 12.0, helperText: "Standar: ≥ 12.0 V" },
                    { id: "kebersihan", label: "Kebersihan", type: "toggle", helperText: "O = Bersih, X = Kotor (NG)" },
                ],
            },
            {
                id: "WARMING-UP",
                name: "Warming Up & Black Out Logsheet",
                freq: "FC 4",
                items: [
                    { id: "jamStart", label: "Jam Start", type: "time" },
                    { id: "jamStop", label: "Jam Stop", type: "time" },
                    { id: "alasan", label: "Alasan", type: "dropdown", options: ["Warming Up", "Black Out", "Lain-lain"] },
                    { id: "volt1P", label: "Voltase 1 Phase (R-N)", type: "number", unit: "V", ngRule: (v) => Number(v) < 210 || Number(v) > 230, helperText: "Standar: 210–230 V" },
                    { id: "volt3P", label: "Voltase 3 Phase (R-S-T)", type: "number", unit: "V", ngRule: (v) => Number(v) < 370 || Number(v) > 410, helperText: "Standar: 370–410 V" },
                    { id: "frekuensi", label: "Frekuensi", type: "number", unit: "Hz", ngRule: (v) => Math.abs(Number(v) - 50) > 2, helperText: "Standar: 50 Hz ±2 Hz" },
                    { id: "rpm", label: "RPM Generator", type: "number", unit: "rpm", placeholder: "Baca tachometer" },
                ],
            },
            {
                id: "TANGKI-SOLAR",
                name: "Tangki Solar Harian",
                freq: "FC 4",
                items: [
                    { id: "tangkiSolar", label: "Kondisi Tangki Solar", type: "toggle", helperText: "O = Tidak bocor" },
                    { id: "levelingSolar", label: "Leveling Solar", type: "toggle", helperText: "O = Mudah terlihat" },
                    { id: "motorPompaSolar", label: "Motor Pompa Solar", type: "toggle", helperText: "O = Tidak bocor" },
                    { id: "pompaSolar", label: "Pompa Solar", type: "toggle", helperText: "O = Berputar normal" },
                    { id: "pipaSaluran", label: "Pipa Saluran", type: "toggle", helperText: "O = Tidak bocor" },
                    { id: "tombolOnOff", label: "Tombol ON/OFF", type: "toggle", helperText: "O = Berfungsi normal" },
                    { id: "volumeSolar", label: "Volume Solar", type: "number", unit: "Liter", ngRule: (v) => Number(v) <= 60, helperText: "Standar: > 60 Liter" },
                ],
            },
        ],
    },
    {
        id: "DIST_LISTRIK",
        name: "Sistem Distribusi Listrik TM & TR",
        shortName: "PANEL & TRAFO",
        icon: <Zap size={20} />,
        color: "#1d4ed8",
        bgColor: "#eff6ff",
        borderColor: "#93c5fd",
        equipment: [
            {
                id: "MAIN-PANEL",
                name: "Main Panel Distribusi ACB",
                freq: "FC 3",
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
                ],
            },
            {
                id: "TRAVO",
                name: "Main Distribution Transformer",
                freq: "FC 3",
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
        shortName: "AIR COMPRESSOR & DRYER",
        icon: <Wind size={20} />,
        color: "#065f46",
        bgColor: "#ecfdf5",
        borderColor: "#6ee7b7",
        equipment: [
            {
                id: "STORAGE-TANK",
                name: "Tangki Penampung Udara Bertekanan",
                freq: "Storage Tank 2",
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
                freq: "FC 1",
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
                freq: "FC 4",
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
                freq: "FC 2",
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
                freq: "FC 4",
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
                freq: "Orion",
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
                freq: "FC 4",
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
        shortName: "FIRE HYDRANT",
        icon: <Shield size={20} />,
        color: "#991b1b",
        bgColor: "#fef2f2",
        borderColor: "#fca5a5",
        equipment: [
            {
                id: "BOOSTER-PUMP",
                name: "Fire Hydrant Booster Pump (Pompa 1, 2, 3)",
                freq: "Pompa 1, 2, 3",
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
    { label: "Shift Pagi", start: "07:00", end: "15:00" },
    { label: "Shift Siang", start: "15:00", end: "23:00" },
    { label: "Shift Malam", start: "23:00", end: "07:00" },
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

function scorePillStyle(percent: number, hasNG: boolean): React.CSSProperties {
    if (hasNG) return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" };
    if (percent === 100) return { background: "#f0fdf4", color: "#166534", border: "1px solid #86efac" };
    if (percent >= 60) return { background: "#eff6ff", color: "#1e40af", border: "1px solid #93c5fd" };
    if (percent > 0) return { background: "#fefce8", color: "#854d0e", border: "1px solid #fde047" };
    return { background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb" };
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DRAFT_KEY_PREFIX = "echecksheet_ph_draft_";

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

interface ToggleCellProps {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
}

function ToggleCell({ value, onChange, disabled }: ToggleCellProps) {
    return (
        <div style={{ display: "flex", gap: 6 }}>
            {(["O", "X"] as const).map((sym) => (
                <button
                    key={sym}
                    disabled={disabled}
                    onClick={() => onChange(value === sym ? "" : sym)}
                    style={{
                        width: 40,
                        height: 32,
                        borderRadius: 6,
                        border: "1.5px solid",
                        borderColor: value === sym ? (sym === "O" ? "#16a34a" : "#dc2626") : "#d1d5db",
                        background: value === sym ? (sym === "O" ? "#dcfce7" : "#fee2e2") : "#fff",
                        color: value === sym ? (sym === "O" ? "#15803d" : "#b91c1c") : "#9ca3af",
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: disabled ? "not-allowed" : "pointer",
                        transition: "all 0.15s",
                    }}
                >
                    {sym}
                </button>
            ))}
        </div>
    );
}

interface DropdownCellProps {
    value: string;
    options: string[];
    onChange: (v: string) => void;
    disabled?: boolean;
}

function DropdownCell({ value, options, onChange, disabled }: DropdownCellProps) {
    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <select
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    appearance: "none",
                    paddingRight: 28,
                    paddingLeft: 10,
                    paddingTop: 6,
                    paddingBottom: 6,
                    border: "1.5px solid #d1d5db",
                    borderRadius: 6,
                    background: "#fff",
                    fontSize: 13,
                    color: "#111827",
                    cursor: disabled ? "not-allowed" : "pointer",
                    minWidth: 180,
                }}
            >
                <option value="">-- Pilih --</option>
                {options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} />
        </div>
    );
}

// Wizard step indicator shown across the "form" tab
function WizardSteps({
    step,
    canGoShift,
    canGoInspection,
    onNavigate,
}: {
    step: "area" | "shift" | "inspection-list" | "inspection-item";
    canGoShift: boolean;
    canGoInspection: boolean;
    onNavigate: (s: "area" | "shift" | "inspection-list") => void;
}) {
    const items: { key: "area" | "shift" | "inspection-list"; label: string; icon: React.ReactNode; enabled: boolean }[] = [
        { key: "area", label: "1. Pilih Area", icon: <MapPin size={14} />, enabled: true },
        { key: "shift", label: "2. Jam Shift", icon: <Clock size={14} />, enabled: canGoShift },
        { key: "inspection-list", label: "3. Inspeksi", icon: <ClipboardList size={14} />, enabled: canGoInspection },
    ];
    const activeKey = step === "inspection-item" ? "inspection-list" : step;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            {items.map((it, idx) => {
                const isActive = it.key === activeKey;
                return (
                    <React.Fragment key={it.key}>
                        <button
                            disabled={!it.enabled}
                            onClick={() => it.enabled && onNavigate(it.key)}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "7px 14px", borderRadius: 20, border: "1.5px solid",
                                borderColor: isActive ? "#1e3a5f" : it.enabled ? "#cbd5e1" : "#e2e8f0",
                                background: isActive ? "#1e3a5f" : "#fff",
                                color: isActive ? "#fff" : it.enabled ? "#475569" : "#cbd5e1",
                                fontWeight: 600, fontSize: 12.5,
                                cursor: it.enabled ? "pointer" : "not-allowed",
                            }}
                        >
                            {it.icon} {it.label}
                        </button>
                        {idx < items.length - 1 && <ChevronRight size={14} color="#cbd5e1" />}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function EChecksheetPowerHouseForm() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
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
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null);

    // History states
    const [sessions, setSessions] = useState<InspectionSession[]>([]);
    const [historyYear, setHistoryYear] = useState<number>(new Date().getFullYear());
    const [historyMonth, setHistoryMonth] = useState<number>(new Date().getMonth());
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [detailSession, setDetailSession] = useState<InspectionSession | null>(null);
    const [editSession, setEditSession] = useState<InspectionSession | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const tglISO = new Date().toISOString().slice(0, 10);
    const draftKey = `${DRAFT_KEY_PREFIX}${tglISO}`;

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
        
    }, [formValues, catatanNG, shiftStart, shiftEnd, selectedGroupId]);

    
    useEffect(() => {
        if (activeTab === "history") {
            loadHistory();
        }
       
    }, [activeTab, historyYear, historyMonth]);

    async function loadHistory() {
        setIsLoadingHistory(true);
        try {
            const USE_MOCK = true; 
            if (USE_MOCK) {
                const all = JSON.parse(
                    window.localStorage.getItem("echecksheet_ph_sessions") ?? "[]"
                ) as InspectionSession[];
                // filter by year & month
                const filtered = all.filter((s) => {
                    const d = new Date(s.createdAt);
                    return d.getFullYear() === historyYear && d.getMonth() === historyMonth;
                });
                setSessions(filtered);
                return;
            }

            const res = await fetch(
                `/e-checksheet-ga/api/powerhouse/inspections?year=${historyYear}&month=${historyMonth + 1}`
            );
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions ?? []);
            }
        } catch {
            /* network failure gracefully ignored */
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

    const allNGHaveCatatan = useMemo(
        () => ngItems.every((ng) => (catatanNG[`${ng.equipId}_${ng.itemId}`] ?? "").trim().length > 0),
        [ngItems, catatanNG]
    );

    const canSubmit = ngItems.length === 0 || allNGHaveCatatan;

    const filledEquipCountAll = useMemo(
        () => ALL_EQUIPMENT.filter((e) => isEquipFilled(e.id, formValues)).length,
        [formValues]
    );

    function resetAll() {
        setFormValues({});
        setCatatanNG({});
        setSelectedGroupId(null);
        setCurrentEquipId(null);
        setShiftStart("");
        setShiftEnd("");
        setStep("area");
        try { window.localStorage.removeItem(draftKey); } catch { /* ignore */ }
        setDraftRestoredAt(null);
    }

    async function handleSubmit() {
        if (!canSubmit) return;
        setIsSaving(true);
        try {
            const body: InspectionSession = {
                id: `local_${Date.now()}`,
                tgl: tglISO,
                shift: shiftStart && shiftEnd ? `${shiftStart}–${shiftEnd}` : "",
                pic: user?.fullName ?? "—",
                values: formValues,
                ngItems,
                scorePercent: overallScore,
                createdAt: new Date().toISOString(),
            };

            // ── TRIAL MODE: simpan ke localStorage, skip API ──
            const USE_MOCK = true; // ganti false kalau API sudah siap
            if (USE_MOCK) {
                const existing = JSON.parse(
                    window.localStorage.getItem("echecksheet_ph_sessions") ?? "[]"
                ) as InspectionSession[];
                existing.unshift(body);
                window.localStorage.setItem(
                    "echecksheet_ph_sessions",
                    JSON.stringify(existing)
                );
                setShowPreviewModal(false);
                resetAll();
                setActiveTab("history");
                return;
            }

            // ── PRODUCTION: panggil API ──
            const res = await fetch("/e-checksheet-ga/api/powerhouse/inspections/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setShowPreviewModal(false);
                resetAll();
                setActiveTab("history");
            }
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteSession(id: string) {
        try {
            const USE_MOCK = true;
            if (USE_MOCK) {
                const all = JSON.parse(
                    window.localStorage.getItem("echecksheet_ph_sessions") ?? "[]"
                ) as InspectionSession[];
                window.localStorage.setItem(
                    "echecksheet_ph_sessions",
                    JSON.stringify(all.filter((s) => s.id !== id))
                );
                setSessions((prev) => prev.filter((s) => s.id !== id));
                return;
            }
            await fetch(`/e-checksheet-ga/api/powerhouse/inspections/${id}`, { method: "DELETE" });
            setSessions((prev) => prev.filter((s) => s.id !== id));
        } finally {
            setDeleteConfirmId(null);
        }
    }

    async function handleEditSave(session: InspectionSession) {
        try {
            const USE_MOCK = true;
            if (USE_MOCK) {
                const all = JSON.parse(
                    window.localStorage.getItem("echecksheet_ph_sessions") ?? "[]"
                ) as InspectionSession[];
                const updated = all.map((s) => (s.id === session.id ? { ...session, editedAt: new Date().toISOString() } : s));
                window.localStorage.setItem("echecksheet_ph_sessions", JSON.stringify(updated));
                setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...session, editedAt: new Date().toISOString() } : s)));
                setEditSession(null);
                return;
            }
            const res = await fetch(`/e-checksheet-ga/api/powerhouse/inspections/${session.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ values: session.values, editedAt: new Date().toISOString() }),
            });
            if (res.ok) {
                setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...session, editedAt: new Date().toISOString() } : s)));
                setEditSession(null);
            }
        } catch { /* ignored */ }
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

    // Monthly trend for bar chart
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

    // ─── RENDER ───────────────────────────────────────────────────────────────

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
            <Sidebar />
            <main style={{ flex: 1, padding: "24px 28px", maxWidth: 1280, margin: "0 auto" }}>
                {/* ── TOP BANNER BAR ── */}
                <div style={{
                    marginBottom: 20,
                    borderRadius: 16,
                    padding: "20px 24px",
                    background: "linear-gradient(120deg, #14294a 0%, #1e3a5f 55%, #24456f 100%)",
                    boxShadow: "0 8px 24px -8px rgba(30,58,95,0.55)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                            background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 12px",
                            display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.18)",
                        }}>
                            <Flame size={22} color="#fbbf24" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                                E-Checksheet Power House
                            </h1>
                            <p style={{ margin: 0, fontSize: 12.5, color: "#cbd5e1" }}>
                                PT Jatim Autocomp Indonesia · PGA Dept. Utility · {todayStr}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                            padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: isOnline ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.2)",
                            color: isOnline ? "#86efac" : "#fca5a5",
                            border: `1px solid ${isOnline ? "rgba(134,239,172,0.4)" : "rgba(252,165,165,0.4)"}`,
                        }}>
                            {isOnline ? "● Online" : "● Offline"}
                        </span>
                        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.12)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.18)" }}>
                            PIC: {user?.fullName ?? "—"}
                        </span>
                        {activeTab === "form" && (
                            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.12)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.18)" }}>
                                {filledEquipCountAll}/{ALL_EQUIPMENT.length} alat terisi
                            </span>
                        )}
                    </div>
                </div>

                {/* ── TABS ── */}
                <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1.5px solid #e2e8f0" }}>
                    {[
                        { key: "form", label: "Form Input", icon: <ClipboardList size={15} /> },
                        { key: "history", label: "Riwayat Inspeksi", icon: <History size={15} /> },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as "form" | "history")}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "8px 18px", border: "none", background: "none",
                                cursor: "pointer", fontSize: 14, fontWeight: 600,
                                borderBottom: activeTab === tab.key ? "2.5px solid #1e3a5f" : "2.5px solid transparent",
                                color: activeTab === tab.key ? "#1e3a5f" : "#94a3b8",
                                marginBottom: -1.5,
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ═══════════════════════════════════════════════════════ */}
                {/*  TAB: FORM INPUT (WIZARD)                               */}
                {/* ═══════════════════════════════════════════════════════ */}
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
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                                background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 10,
                                padding: "10px 14px", marginBottom: 18, fontSize: 12.5, color: "#1e40af",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <FileCheck2 size={15} />
                                    Draft tersimpan otomatis dipulihkan (terakhir disimpan {new Date(draftRestoredAt).toLocaleTimeString("id-ID")}).
                                </div>
                                <button
                                    onClick={resetAll}
                                    style={{ background: "none", border: "none", color: "#1e40af", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                                >
                                    Buang Draft
                                </button>
                            </div>
                        )}

                        {/* ── STEP 1: PILIH AREA ── */}
                        {step === "area" && (
                            <div>
                                <div style={{ marginBottom: 14 }}>
                                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Pilih Area Inspeksi</h2>
                                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>Pilih salah satu sistem yang akan diperiksa terlebih dahulu.</p>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                                    {SYSTEM_GROUPS.map((group) => {
                                        const totalEquip = group.equipment.length;
                                        const filledEquip = group.equipment.filter((e) => isEquipFilled(e.id, formValues)).length;
                                        return (
                                            <button
                                                key={group.id}
                                                onClick={() => handleSelectArea(group.id)}
                                                style={{
                                                    textAlign: "left", cursor: "pointer",
                                                    background: group.bgColor,
                                                    border: `1.5px solid ${selectedGroupId === group.id ? group.color : group.borderColor}`,
                                                    borderRadius: 14, padding: 18,
                                                    boxShadow: selectedGroupId === group.id ? `0 0 0 3px ${group.color}22` : "none",
                                                    transition: "box-shadow 0.15s",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                                    <div style={{ background: group.color, color: "#fff", borderRadius: 10, padding: "8px 10px", display: "flex" }}>
                                                        {group.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: group.color, textTransform: "uppercase" }}>
                                                            {group.shortName}
                                                        </div>
                                                        <div style={{ fontSize: 13, color: "#334155", fontWeight: 600, lineHeight: 1.3 }}>{group.name}</div>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                                                    {totalEquip} alat · {filledEquip}/{totalEquip} sudah diisi
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <div style={{ background: "#e2e8f0", borderRadius: 4, height: 6, flex: 1, marginRight: 12, overflow: "hidden" }}>
                                                        <div style={{
                                                            height: "100%", borderRadius: 4, background: group.color,
                                                            width: `${totalEquip === 0 ? 0 : (filledEquip / totalEquip) * 100}%`,
                                                            transition: "width 0.3s",
                                                        }} />
                                                    </div>
                                                    <ChevronRight size={16} color={group.color} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: JAM SHIFT ── */}
                        {step === "shift" && currentGroup && (
                            <div style={{ maxWidth: 560 }}>
                                <button
                                    onClick={goToArea}
                                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 14, padding: 0 }}
                                >
                                    <ChevronLeft size={15} /> Ganti Area
                                </button>
                                <div style={{
                                    background: "#fff", border: `1.5px solid ${currentGroup.borderColor}`, borderRadius: 14, padding: 22,
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                        <div style={{ background: currentGroup.color, color: "#fff", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Rentang Jam Shift</h2>
                                            <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>Area: {currentGroup.name}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0 18px" }}>
                                        {SHIFT_PRESETS.map((p) => (
                                            <button
                                                key={p.label}
                                                onClick={() => { setShiftStart(p.start); setShiftEnd(p.end); }}
                                                style={{
                                                    padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                                                    borderColor: shiftStart === p.start && shiftEnd === p.end ? "#1e3a5f" : "#cbd5e1",
                                                    background: shiftStart === p.start && shiftEnd === p.end ? "#1e3a5f" : "#fff",
                                                    color: shiftStart === p.start && shiftEnd === p.end ? "#fff" : "#64748b",
                                                    fontWeight: 600, fontSize: 12.5, cursor: "pointer",
                                                }}
                                            >
                                                {p.label} ({p.start}–{p.end})
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Jam Mulai</label>
                                            <input
                                                type="time"
                                                value={shiftStart}
                                                onChange={(e) => setShiftStart(e.target.value)}
                                                style={{ padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, width: 140 }}
                                            />
                                        </div>
                                        <span style={{ color: "#94a3b8", marginTop: 18 }}>—</span>
                                        <div>
                                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>Jam Selesai</label>
                                            <input
                                                type="time"
                                                value={shiftEnd}
                                                onChange={(e) => setShiftEnd(e.target.value)}
                                                style={{ padding: "8px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, width: 140 }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
                                        <button
                                            onClick={goToInspectionList}
                                            disabled={!shiftStart || !shiftEnd}
                                            style={{
                                                padding: "9px 22px", borderRadius: 8, border: "none",
                                                background: shiftStart && shiftEnd ? "#1e3a5f" : "#94a3b8",
                                                color: "#fff", fontWeight: 700, fontSize: 14,
                                                cursor: shiftStart && shiftEnd ? "pointer" : "not-allowed",
                                                display: "flex", alignItems: "center", gap: 8,
                                            }}
                                        >
                                            Lanjut ke Inspeksi <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3a: DAFTAR ALAT (INSPEKSI) ── */}
                        {step === "inspection-list" && currentGroup && (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                                    <div>
                                        <button
                                            onClick={goToArea}
                                            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 6, padding: 0 }}
                                        >
                                            <ChevronLeft size={15} /> Ganti Area
                                        </button>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ background: currentGroup.color, color: "#fff", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
                                                {currentGroup.icon}
                                            </div>
                                            <div>
                                                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{currentGroup.name}</h2>
                                                <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
                                                    Shift {shiftStart}–{shiftEnd} · {currentGroup.equipment.length} alat
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep("shift")}
                                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                                    >
                                        <Clock size={13} /> Ubah Jam Shift
                                    </button>
                                </div>

                                {/* Search */}
                                <div style={{ position: "relative", maxWidth: 320, marginBottom: 16 }}>
                                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                    <input
                                        type="text"
                                        placeholder="Cari alat..."
                                        value={equipSearch}
                                        onChange={(e) => setEquipSearch(e.target.value)}
                                        style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, marginBottom: 24 }}>
                                    {filteredGroupEquipment.map((equip) => {
                                        const filled = isEquipFilled(equip.id, formValues);
                                        const complete = isEquipComplete(equip, formValues);
                                        const equipHasNG = equip.items.some((item) => {
                                            const v = formValues[equip.id]?.[item.id] ?? "";
                                            return v && isItemNG(item, v);
                                        });
                                        return (
                                            <button
                                                key={equip.id}
                                                onClick={() => handleOpenEquip(equip.id)}
                                                style={{
                                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                                    padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                                                    border: `1.5px solid ${equipHasNG ? "#fca5a5" : complete ? "#86efac" : "#e2e8f0"}`,
                                                    background: equipHasNG ? "#fff1f2" : "#fff",
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{equip.name}</div>
                                                    <div style={{ fontSize: 11.5, color: "#94a3b8" }}>Freq: {equip.freq}</div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    {equipHasNG ? (
                                                        <span style={{ padding: "3px 9px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "#fee2e2", color: "#b91c1c" }}>NG</span>
                                                    ) : complete ? (
                                                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                                                            <CheckCircle size={14} /> Selesai
                                                        </span>
                                                    ) : filled ? (
                                                        <span style={{ padding: "3px 9px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: "#fefce8", color: "#854d0e" }}>Sebagian</span>
                                                    ) : (
                                                        <span style={{ fontSize: 11, color: "#cbd5e1" }}>Belum diisi</span>
                                                    )}
                                                    <ChevronRight size={15} color={currentGroup.color} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {filteredGroupEquipment.length === 0 && (
                                        <div style={{ gridColumn: "1 / -1", padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                                            Tidak ada alat yang cocok dengan pencarian.
                                        </div>
                                    )}
                                </div>

                                {/* NG summary */}
                                {ngItems.length > 0 && (
                                    <div style={{
                                        background: "#fff1f2", border: "1.5px solid #fca5a5",
                                        borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                                        display: "flex", alignItems: "flex-start", gap: 10,
                                    }}>
                                        <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, color: "#991b1b", fontSize: 13, marginBottom: 4 }}>
                                                {ngItems.length} Item Abnormal (NG) Terdeteksi di Seluruh Area
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                {ngItems.map((ng) => (
                                                    <span key={`${ng.equipId}_${ng.itemId}`} style={{
                                                        padding: "2px 10px", borderRadius: 10,
                                                        background: "#fee2e2", color: "#b91c1c", fontSize: 11, fontWeight: 600
                                                    }}>
                                                        {ng.label}
                                                    </span>
                                                ))}
                                            </div>
                                            {!allNGHaveCatatan && (
                                                <div style={{ marginTop: 6, fontSize: 12, color: "#dc2626" }}>
                                                    ⚠ Isi catatan tindakan perbaikan pada semua item NG sebelum menyimpan (buka alat terkait).
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                                    <button
                                        onClick={resetAll}
                                        style={{
                                            padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                                            background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer"
                                        }}
                                    >
                                        Reset Semua
                                    </button>
                                    <button
                                        onClick={() => setShowPreviewModal(true)}
                                        disabled={!canSubmit}
                                        style={{
                                            padding: "9px 24px", borderRadius: 8, border: "none",
                                            background: canSubmit ? "#1e3a5f" : "#94a3b8",
                                            color: "#fff", fontWeight: 700, fontSize: 14,
                                            cursor: canSubmit ? "pointer" : "not-allowed",
                                            display: "flex", alignItems: "center", gap: 8,
                                        }}
                                    >
                                        <Eye size={16} /> Preview & Simpan
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3b: FORM ITEM PER ALAT ── */}
                        {step === "inspection-item" && currentEquip && currentEquipGroup && (
                            <div style={{
                                background: "#fff",
                                border: `1.5px solid ${currentEquipGroup.borderColor}`,
                                borderRadius: 14,
                                overflow: "hidden",
                            }}>
                                {/* Panel Header */}
                                <div style={{
                                    padding: "14px 20px",
                                    background: currentEquipGroup.bgColor,
                                    borderBottom: `1px solid ${currentEquipGroup.borderColor}`,
                                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                                }}>
                                    <div>
                                        <button
                                            onClick={() => setStep("inspection-list")}
                                            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: 12.5, fontWeight: 600, cursor: "pointer", marginBottom: 4, padding: 0 }}
                                        >
                                            <ChevronLeft size={14} /> Kembali ke Daftar Alat
                                        </button>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: currentEquipGroup.color }}>
                                            {currentEquip.name}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#64748b" }}>
                                            {currentEquipGroup.name} · Frekuensi: {currentEquip.freq}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleQuickFillNormal(currentEquip)}
                                        title="Isi otomatis semua item toggle yang masih kosong dengan status Normal (O)"
                                        style={{
                                            display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
                                            border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8",
                                            fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                                        }}
                                    >
                                        <Wand2 size={14} /> Isi Cepat Normal (O)
                                    </button>
                                </div>

                                {/* Items Table */}
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "#f8fafc" }}>
                                                {["No", "Item Pemeriksaan", "Standar / Keterangan", "Nilai / Status", "Status", "Catatan"].map((h) => (
                                                    <th key={h} style={{
                                                        padding: "10px 14px", textAlign: "left", fontSize: 11,
                                                        fontWeight: 700, color: "#64748b", textTransform: "uppercase",
                                                        letterSpacing: "0.05em", borderBottom: "1.5px solid #e2e8f0",
                                                    }}>
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentEquip.items.map((item, idx) => {
                                                const value = getItemValue(currentEquip.id, item.id);
                                                const ng = value !== "" && isItemNG(item, value);
                                                const ngKey = `${currentEquip.id}_${item.id}`;
                                                return (
                                                    <tr
                                                        key={item.id}
                                                        style={{ background: ng ? "#fff1f2" : idx % 2 === 0 ? "#fff" : "#fafafa" }}
                                                    >
                                                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#94a3b8", width: 36 }}>{idx + 1}</td>
                                                        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#1e293b", minWidth: 180 }}>
                                                            {item.label}
                                                            {item.unit && <span style={{ color: "#94a3b8", fontSize: 11, marginLeft: 4 }}>({item.unit})</span>}
                                                        </td>
                                                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b", minWidth: 160 }}>
                                                            {item.helperText ?? "—"}
                                                        </td>
                                                        <td style={{ padding: "10px 14px", minWidth: 180 }}>
                                                            {item.type === "toggle" && (
                                                                <ToggleCell value={value} onChange={(v) => handleItemChange(currentEquip.id, item.id, v)} />
                                                            )}
                                                            {item.type === "dropdown" && (
                                                                <DropdownCell
                                                                    value={value}
                                                                    options={item.options ?? []}
                                                                    onChange={(v) => handleItemChange(currentEquip.id, item.id, v)}
                                                                />
                                                            )}
                                                            {item.type === "number" && (
                                                                <input
                                                                    type="number"
                                                                    value={value}
                                                                    placeholder={item.placeholder ?? "0"}
                                                                    onChange={(e) => handleItemChange(currentEquip.id, item.id, e.target.value)}
                                                                    style={{
                                                                        padding: "6px 10px", border: `1.5px solid ${ng ? "#fca5a5" : "#d1d5db"}`,
                                                                        borderRadius: 6, fontSize: 13, width: 110,
                                                                        background: ng ? "#fff1f2" : "#fff",
                                                                    }}
                                                                />
                                                            )}
                                                            {item.type === "time" && (
                                                                <input
                                                                    type="time"
                                                                    value={value}
                                                                    onChange={(e) => handleItemChange(currentEquip.id, item.id, e.target.value)}
                                                                    style={{
                                                                        padding: "6px 10px", border: "1.5px solid #d1d5db",
                                                                        borderRadius: 6, fontSize: 13,
                                                                    }}
                                                                />
                                                            )}
                                                            {item.type === "text" && (
                                                                <input
                                                                    type="text"
                                                                    value={value}
                                                                    placeholder={item.placeholder ?? ""}
                                                                    onChange={(e) => handleItemChange(currentEquip.id, item.id, e.target.value)}
                                                                    style={{
                                                                        padding: "6px 10px", border: "1.5px solid #d1d5db",
                                                                        borderRadius: 6, fontSize: 13, width: 180,
                                                                    }}
                                                                />
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "10px 14px", textAlign: "center", width: 72 }}>
                                                            {value === "" ? (
                                                                <span style={{ fontSize: 11, color: "#cbd5e1" }}>—</span>
                                                            ) : ng ? (
                                                                <span style={{ padding: "2px 8px", borderRadius: 10, background: "#fee2e2", color: "#b91c1c", fontSize: 11, fontWeight: 700 }}>NG</span>
                                                            ) : (
                                                                <CheckCircle size={16} color="#22c55e" />
                                                            )}
                                                        </td>
                                                        <td style={{ padding: "10px 14px", minWidth: 200 }}>
                                                            {ng ? (
                                                                <textarea
                                                                    rows={2}
                                                                    value={catatanNG[ngKey] ?? ""}
                                                                    onChange={(e) => setCatatanNG((prev) => ({ ...prev, [ngKey]: e.target.value }))}
                                                                    placeholder="Wajib isi tindakan perbaikan..."
                                                                    style={{
                                                                        width: "100%", padding: "5px 8px",
                                                                        border: `1.5px solid ${(catatanNG[ngKey] ?? "").trim() === "" ? "#fca5a5" : "#86efac"}`,
                                                                        borderRadius: 6, fontSize: 12, resize: "none",
                                                                        background: "#fff",
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Prev/Next navigation footer */}
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "12px 20px", borderTop: "1px solid #f1f5f9", background: "#f8fafc",
                                }}>
                                    <button
                                        onClick={() => handleNavEquip(-1)}
                                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                                    >
                                        <ChevronLeft size={15} /> Alat Sebelumnya
                                    </button>
                                    <span style={{ fontSize: 12, color: "#94a3b8" }}>
                                        Alat {currentEquipGroup.equipment.findIndex((e) => e.id === currentEquip.id) + 1} dari {currentEquipGroup.equipment.length}
                                    </span>
                                    <button
                                        onClick={() => handleNavEquip(1)}
                                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                                    >
                                        Alat Berikutnya <ChevronRight size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════ */}
                {/*  TAB: HISTORY (skor % OK & status hanya di sini)        */}
                {/* ═══════════════════════════════════════════════════════ */}
                {activeTab === "history" && (
                    <div>
                        {/* Filter Row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                            <div style={{ position: "relative" }}>
                                <select
                                    value={historyYear}
                                    onChange={(e) => setHistoryYear(Number(e.target.value))}
                                    style={{ padding: "7px 28px 7px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", appearance: "none", fontSize: 13, background: "#fff" }}
                                >
                                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }} />
                            </div>
                            <div style={{ position: "relative" }}>
                                <select
                                    value={historyMonth}
                                    onChange={(e) => setHistoryMonth(Number(e.target.value))}
                                    style={{ padding: "7px 28px 7px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", appearance: "none", fontSize: 13, background: "#fff" }}
                                >
                                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }} />
                            </div>
                            <button
                                onClick={loadHistory}
                                style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569" }}
                            >
                                <RefreshCw size={14} /> Refresh
                            </button>
                        </div>

                        {isLoadingHistory ? (
                            <div style={{ textAlign: "center", padding: 48 }}>
                                <Loader2 size={28} color="#1e3a5f" style={{ animation: "spin 1s linear infinite" }} />
                            </div>
                        ) : (
                            <>
                                {/* Overall score summary for the period */}
                                {sessions.length > 0 && (() => {
                                    const avgScore = Math.round(sessions.reduce((sum, s) => sum + s.scorePercent, 0) / sessions.length);
                                    const totalNG = sessions.reduce((sum, s) => sum + s.ngItems.length, 0);
                                    return (
                                        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                                            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 18px" }}>
                                                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Rata-rata Skor % OK</div>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: "#1e3a5f" }}>{avgScore}%</div>
                                            </div>
                                            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 18px" }}>
                                                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Total Sesi</div>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: "#1e3a5f" }}>{sessions.length}</div>
                                            </div>
                                            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "12px 18px" }}>
                                                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Total Temuan NG</div>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: totalNG > 0 ? "#dc2626" : "#16a34a" }}>{totalNG}</div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* NG Category Metrics */}
                                {sessions.length > 0 && (() => {
                                    const cats = categorizeNG(sessions);
                                    const catColors: Record<string, string> = {
                                        "Suhu Berlebih": "#f97316",
                                        "Tekanan Abnormal": "#3b82f6",
                                        "Voltase/Arus di Luar Standar": "#a855f7",
                                        "Kebocoran/Mekanikal": "#ef4444",
                                        "5S/Kebersihan": "#22c55e",
                                    };
                                    return (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
                                            {Object.entries(cats).map(([cat, count]) => (
                                                <div key={cat} style={{
                                                    background: "#fff", borderRadius: 10, padding: "12px 16px",
                                                    border: "1.5px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 4
                                                }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: catColors[cat] ?? "#94a3b8" }} />
                                                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{cat}</div>
                                                    <div style={{ fontSize: 22, fontWeight: 800, color: count > 0 ? catColors[cat] : "#94a3b8" }}>{count}</div>
                                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>temuan NG</div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {/* Monthly Bar Chart */}
                                {sessions.length > 0 && (() => {
                                    const trend = buildMonthlyTrend(sessions);
                                    const maxVal = Math.max(...trend, 1);
                                    const barW = 28;
                                    const chartH = 100;
                                    return (
                                        <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "16px 20px", marginBottom: 24 }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 14 }}>Tren Temuan NG Bulanan — {historyYear}</div>
                                            <div style={{ overflowX: "auto" }}>
                                                <svg width={Math.max(600, 12 * (barW + 16) + 40)} height={chartH + 36} style={{ display: "block" }}>
                                                    {trend.map((val, i) => {
                                                        const barH = val === 0 ? 2 : Math.max(6, Math.round((val / maxVal) * chartH));
                                                        const x = 20 + i * (barW + 16);
                                                        const y = chartH - barH;
                                                        return (
                                                            <g key={i}>
                                                                <rect
                                                                    x={x} y={y} width={barW} height={barH}
                                                                    rx={4} fill={val > 0 ? "#1e3a5f" : "#e2e8f0"}
                                                                />
                                                                {val > 0 && (
                                                                    <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="#475569">{val}</text>
                                                                )}
                                                                <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize={10} fill="#94a3b8">
                                                                    {MONTHS[i].slice(0, 3)}
                                                                </text>
                                                            </g>
                                                        );
                                                    })}
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* History Table */}
                                <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
                                    <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#1e293b" }}>
                                        Daftar Sesi Inspeksi ({sessions.length})
                                    </div>
                                    {sessions.length === 0 ? (
                                        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                                            Belum ada data inspeksi untuk periode ini.
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: "auto" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead>
                                                    <tr style={{ background: "#f8fafc" }}>
                                                        {["Tanggal", "Shift", "PIC", "% OK", "NG", "Waktu Catat", "Aksi"].map((h) => (
                                                            <th key={h} style={{
                                                                padding: "10px 14px", textAlign: "left", fontSize: 11,
                                                                fontWeight: 700, color: "#64748b", textTransform: "uppercase",
                                                                letterSpacing: "0.05em", borderBottom: "1.5px solid #e2e8f0"
                                                            }}>
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sessions.map((session, idx) => (
                                                        <tr key={session.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                                                            <td style={{ padding: "10px 14px", fontSize: 13, color: "#1e293b" }}>
                                                                {new Date(session.tgl).toLocaleDateString("id-ID")}
                                                            </td>
                                                            <td style={{ padding: "10px 14px", fontSize: 13, color: "#475569" }}>{session.shift}</td>
                                                            <td style={{ padding: "10px 14px", fontSize: 13, color: "#475569" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                    {session.pic}
                                                                    {session.editedAt && (
                                                                        <span style={{ padding: "1px 7px", borderRadius: 8, background: "#fef9c3", color: "#854d0e", fontSize: 10, fontWeight: 600 }}>Diedit</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: "10px 14px" }}>
                                                                <span style={{
                                                                    padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                                                                    ...scorePillStyle(session.scorePercent, session.ngItems.length > 0)
                                                                }}>
                                                                    {session.scorePercent}%
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: "10px 14px" }}>
                                                                {session.ngItems.length > 0 ? (
                                                                    <span style={{ padding: "2px 8px", borderRadius: 8, background: "#fee2e2", color: "#b91c1c", fontSize: 12, fontWeight: 700 }}>
                                                                        {session.ngItems.length} NG
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ color: "#22c55e", fontWeight: 600, fontSize: 12 }}>✓ Normal</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8" }}>
                                                                {new Date(session.createdAt).toLocaleString("id-ID")}
                                                            </td>
                                                            <td style={{ padding: "10px 14px" }}>
                                                                <div style={{ display: "flex", gap: 6 }}>
                                                                    <button
                                                                        onClick={() => setDetailSession(session)}
                                                                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#475569" }}
                                                                    >
                                                                        <Info size={13} /> Detail
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditSession(session)}
                                                                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #bfdbfe", background: "#eff6ff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#1d4ed8" }}
                                                                    >
                                                                        <Edit3 size={13} /> Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteConfirmId(session.id)}
                                                                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#dc2626" }}
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
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

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/*  MODAL: PREVIEW & SIMPAN                                           */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {showPreviewModal && (
                <ModalOverlay onClose={() => setShowPreviewModal(false)}>
                    <div style={{ width: "min(96vw, 680px)", maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: 16, padding: 28 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Preview Sebelum Simpan</h2>
                            <button onClick={() => setShowPreviewModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                <X size={20} color="#94a3b8" />
                            </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                            <InfoRow label="Tanggal" value={todayStr} />
                            <InfoRow label="Jam Shift" value={shiftStart && shiftEnd ? `${shiftStart} – ${shiftEnd}` : "—"} />
                            <InfoRow label="PIC" value={user?.fullName ?? "—"} />
                            <InfoRow label="Skor Keseluruhan" value={
                                <span style={{ fontWeight: 700, ...scorePillStyle(overallScore, ngItems.length > 0), padding: "2px 10px", borderRadius: 10, fontSize: 13 }}>
                                    {overallScore}% OK
                                </span>
                            } />
                        </div>
                        {ngItems.length > 0 && (
                            <div style={{ background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                <div style={{ fontWeight: 700, color: "#991b1b", fontSize: 13, marginBottom: 8 }}>
                                    Item NG ({ngItems.length}):
                                </div>
                                {ngItems.map((ng) => {
                                    const ngKey = `${ng.equipId}_${ng.itemId}`;
                                    return (
                                        <div key={ngKey} style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 4 }}>
                                            <strong>{ng.label}</strong>
                                            {catatanNG[ngKey] && <span style={{ color: "#475569" }}> — {catatanNG[ngKey]}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                            >
                                Kembali & Periksa
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                style={{
                                    padding: "9px 24px", borderRadius: 8, border: "none",
                                    background: "#1e3a5f", color: "#fff", fontWeight: 700, fontSize: 14,
                                    cursor: isSaving ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", gap: 8, opacity: isSaving ? 0.7 : 1,
                                }}
                            >
                                {isSaving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
                                {isSaving ? "Menyimpan..." : "Simpan Data"}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/*  MODAL: DETAIL SESI                                                 */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {detailSession && (
                <ModalOverlay onClose={() => setDetailSession(null)}>
                    <div style={{ width: "min(96vw, 720px)", maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: 16, padding: 28 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                                Detail Sesi — {new Date(detailSession.tgl).toLocaleDateString("id-ID")} · {detailSession.shift}
                            </h2>
                            <button onClick={() => setDetailSession(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                <X size={20} color="#94a3b8" />
                            </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                            <InfoRow label="PIC" value={detailSession.pic} />
                            <InfoRow label="Skor" value={`${detailSession.scorePercent}% OK`} />
                            <InfoRow label="Waktu Catat" value={new Date(detailSession.createdAt).toLocaleString("id-ID")} />
                            {detailSession.editedAt && <InfoRow label="Terakhir Diedit" value={new Date(detailSession.editedAt).toLocaleString("id-ID")} />}
                        </div>
                        {detailSession.ngItems.length > 0 && (
                            <div style={{ background: "#fff1f2", borderRadius: 8, padding: 12, border: "1px solid #fca5a5" }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: "#991b1b", marginBottom: 8 }}>Temuan NG:</div>
                                {detailSession.ngItems.map((ng) => (
                                    <div key={`${ng.equipId}_${ng.itemId}`} style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 2 }}>
                                        ● {ng.label} ({ng.equipId})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ModalOverlay>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/*  MODAL: EDIT SESI                                                   */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {editSession && (
                <ModalOverlay onClose={() => setEditSession(null)}>
                    <div style={{ width: "min(96vw, 780px)", maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: 16, padding: 28 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Edit Sesi Inspeksi</h2>
                                <span style={{ padding: "2px 10px", borderRadius: 8, background: "#fef9c3", color: "#854d0e", fontSize: 11, fontWeight: 600 }}>Diedit</span>
                            </div>
                            <button onClick={() => setEditSession(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                                <X size={20} color="#94a3b8" />
                            </button>
                        </div>
                        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                            Tanggal: <strong>{new Date(editSession.tgl).toLocaleDateString("id-ID")}</strong> · Shift: <strong>{editSession.shift}</strong>
                        </p>
                        {ALL_EQUIPMENT.map((equip) => {
                            const equipVals = editSession.values[equip.id] ?? {};
                            return (
                                <details key={equip.id} style={{ marginBottom: 10 }}>
                                    <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#1e293b", padding: "8px 0" }}>
                                        {equip.name}
                                    </summary>
                                    <div style={{ paddingLeft: 12, paddingTop: 6 }}>
                                        {equip.items.map((item) => (
                                            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                                <span style={{ fontSize: 12, color: "#475569", minWidth: 200 }}>{item.label}</span>
                                                {item.type === "toggle" && (
                                                    <ToggleCell
                                                        value={equipVals[item.id] ?? ""}
                                                        onChange={(v) => setEditSession((prev) => prev ? {
                                                            ...prev,
                                                            values: { ...prev.values, [equip.id]: { ...(prev.values[equip.id] ?? {}), [item.id]: v } }
                                                        } : null)}
                                                    />
                                                )}
                                                {item.type === "dropdown" && (
                                                    <DropdownCell
                                                        value={equipVals[item.id] ?? ""}
                                                        options={item.options ?? []}
                                                        onChange={(v) => setEditSession((prev) => prev ? {
                                                            ...prev,
                                                            values: { ...prev.values, [equip.id]: { ...(prev.values[equip.id] ?? {}), [item.id]: v } }
                                                        } : null)}
                                                    />
                                                )}
                                                {(item.type === "number" || item.type === "text" || item.type === "time") && (
                                                    <input
                                                        type={item.type === "number" ? "number" : item.type === "time" ? "time" : "text"}
                                                        value={equipVals[item.id] ?? ""}
                                                        onChange={(e) => setEditSession((prev) => prev ? {
                                                            ...prev,
                                                            values: { ...prev.values, [equip.id]: { ...(prev.values[equip.id] ?? {}), [item.id]: e.target.value } }
                                                        } : null)}
                                                        style={{ padding: "5px 8px", border: "1.5px solid #d1d5db", borderRadius: 6, fontSize: 13, width: 140 }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            );
                        })}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                            <button onClick={() => setEditSession(null)} style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer" }}>
                                Batal
                            </button>
                            <button
                                onClick={() => handleEditSave(editSession)}
                                style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#1e3a5f", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                            >
                                <Save size={15} /> Simpan Perubahan
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/*  MODAL: KONFIRMASI HAPUS                                            */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {deleteConfirmId && (
                <ModalOverlay onClose={() => setDeleteConfirmId(null)}>
                    <div style={{ width: "min(96vw, 420px)", background: "#fff", borderRadius: 14, padding: 28, textAlign: "center" }}>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ width: 52, height: 52, background: "#fee2e2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <Trash2 size={24} color="#dc2626" />
                            </div>
                            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Hapus Sesi Inspeksi?</h3>
                            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Data yang sudah dihapus tidak dapat dikembalikan.</p>
                        </div>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                style={{ padding: "9px 24px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDeleteSession(deleteConfirmId)}
                                style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, cursor: "pointer" }}
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}

// ─── SMALL HELPER COMPONENTS ─────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1000, padding: 16,
            }}
        >
            <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value}</div>
        </div>
    );
}