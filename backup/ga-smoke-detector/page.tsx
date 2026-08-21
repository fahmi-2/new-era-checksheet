"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

interface DetectorItem {
  no: number
  lokasi: string
  zona: string
}

const SMOKE_DETECTOR_LIST: DetectorItem[] = [
  { no: 1, lokasi: "LOBBY", zona: "1" },
  { no: 2, lokasi: "LOBBY", zona: "1" },
  { no: 3, lokasi: "QC MSA", zona: "1" },
  { no: 4, lokasi: "MEETING ROOM A", zona: "1" },
  { no: 5, lokasi: "MEETING ROOM B", zona: "1" },
  { no: 6, lokasi: "IT", zona: "1" },
  { no: 7, lokasi: "IT", zona: "1" },
  { no: 8, lokasi: "MEETING ROOM C", zona: "1" },
  { no: 9, lokasi: "ACCOUNTING", zona: "1" },
  { no: 10, lokasi: "ACCOUNTING", zona: "1" },
  { no: 11, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 12, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 13, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 14, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 15, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 16, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 17, lokasi: "EXIM", zona: "2" },
  { no: 18, lokasi: "QC RECEIVING", zona: "4" },
  { no: 19, lokasi: "IR", zona: "5" },
  { no: 20, lokasi: "CLINIC", zona: "5" },
  { no: 21, lokasi: "DEPAN OFFICE JIG PROTO NEW", zona: "5" },
  { no: 22, lokasi: "DEPAN CNC ROOM NEW", zona: "5" },
  { no: 23, lokasi: "NYS PREPARATION PA NEW", zona: "5" },
  { no: 24, lokasi: "JP NEW", zona: "5" },
  { no: 25, lokasi: "JP NEW", zona: "5" },
  { no: 26, lokasi: "JP NEW", zona: "5" },
  { no: 27, lokasi: "JP NEW", zona: "5" },
  { no: 28, lokasi: "JP NEW", zona: "5" },
  { no: 29, lokasi: "JP NEW", zona: "5" },
  { no: 30, lokasi: "JP NEW", zona: "5" },
  { no: 31, lokasi: "TRAINING", zona: "6" },
  { no: 32, lokasi: "TRAINING", zona: "6" },
  { no: 33, lokasi: "TRAINING", zona: "6" },
  { no: 34, lokasi: "TRAINING", zona: "6" },
  { no: 35, lokasi: "TRAINING", zona: "6" },
  { no: 36, lokasi: "TRAINING", zona: "6" },
  { no: 37, lokasi: "GELSHEET", zona: "7" },
  { no: 38, lokasi: "GELSHEET", zona: "7" },
  { no: 39, lokasi: "GELSHEET", zona: "7" },
  { no: 40, lokasi: "GELSHEET", zona: "7" },
  { no: 41, lokasi: "RUANG TRAFO (POWER HOUSE B)", zona: "14" },
  { no: 42, lokasi: "RUANG TRAFO (POWER HOUSE B)", zona: "14" },
  { no: 43, lokasi: "PEMBUATAN BOX EXIM NEW", zona: "15" },
  { no: 44, lokasi: "PEMBUATAN BOX EXIM NEW", zona: "15" },
  { no: 45, lokasi: "PEMBUATAN BOX EXIM NEW", zona: "15" },
  { no: 46, lokasi: "PEMBUATAN BOX EXIM NEW", zona: "15" },
  { no: 47, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 48, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 49, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 50, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 51, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 52, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 53, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 54, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 55, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 56, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 57, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 58, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 59, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 60, lokasi: "CUTTING (BAWAH MEZZANINE) NEW", zona: "23" },
  { no: 61, lokasi: "MINISTORE WHS KOLOM 1 SELATAN NEW", zona: "23" },
  { no: 62, lokasi: "MINISTORE WHS KOLOM 1 UTARANEW", zona: "23" },
  { no: 63, lokasi: "MINISTORE WHS KOLOM 2 SELATANNEW", zona: "23" },
  { no: 64, lokasi: "MINISTORE WHS KOLOM 2 UATARANEW", zona: "23" },
  { no: 65, lokasi: "MINISTORE WHS KOLOM 4 SELATANNEW", zona: "23" },
  { no: 66, lokasi: "MINISTORE WHS KOLOM 4 UTARANEW", zona: "23" },
  { no: 67, lokasi: "RECEIVING STORAGE WHS NEW", zona: "23" },
  { no: 68, lokasi: "RECEIVING STORAGE WHS NEW", zona: "23" },
  { no: 69, lokasi: "RECEIVING STORAGE WHS NEW", zona: "23" },
  { no: 70, lokasi: "RECEIVING STORAGE WHS NEW", zona: "23" },
]

const ROR_HEAT_DETECTOR_LIST: DetectorItem[] = [
  { no: 1, lokasi: "KORIDOR LOBBY", zona: "1" },
  { no: 2, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 3, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 4, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 5, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 6, lokasi: "MAIN OFFICE", zona: "1" },
  { no: 7, lokasi: "WAREHOUSE", zona: "4" },
  { no: 8, lokasi: "QC RECEIVING", zona: "4" },
  { no: 9, lokasi: "HR", zona: "5" },
  { no: 10, lokasi: "CNC ROOM", zona: "5" },
  { no: 11, lokasi: "CNC ROOM", zona: "5" },
  { no: 12, lokasi: "JIG PROTO OFFICE", zona: "5" },
  { no: 13, lokasi: "JIG PROTO OFFICE", zona: "5" },
  { no: 14, lokasi: "GENBA C NEW", zona: "7" },
  { no: 15, lokasi: "GENBA C NEW", zona: "7" },
  { no: 16, lokasi: "GENBA C NEW", zona: "7" },
  { no: 17, lokasi: "GENBA C NEW", zona: "7" },
  { no: 18, lokasi: "GENBA C NEW", zona: "7" },
  { no: 19, lokasi: "GENBA C NEW", zona: "7" },
  { no: 20, lokasi: "GENBA C NEW", zona: "7" },
  { no: 21, lokasi: "GENBA C NEW", zona: "7" },
  { no: 22, lokasi: "GENBA C NEW", zona: "7" },
  { no: 23, lokasi: "GENBA C NEW", zona: "7" },
  { no: 24, lokasi: "GENBA C NEW", zona: "7" },
  { no: 25, lokasi: "GENBA C NEW", zona: "7" },
  { no: 26, lokasi: "GENBA C NEW", zona: "7" },
  { no: 27, lokasi: "GENBA C NEW", zona: "7" },
  { no: 28, lokasi: "GENBA C NEW", zona: "7" },
  { no: 29, lokasi: "GENBA C NEW", zona: "7" },
  { no: 30, lokasi: "GENBA C NEW", zona: "7" },
  { no: 31, lokasi: "GENBA C NEW", zona: "7" },
  { no: 32, lokasi: "GENBA C NEW", zona: "7" },
  { no: 33, lokasi: "GENBA C NEW", zona: "7" },
  { no: 34, lokasi: "GENBA C NEW", zona: "7" },
  { no: 35, lokasi: "GENBA C NEW", zona: "7" },
  { no: 36, lokasi: "GENBA C NEW", zona: "7" },
  { no: 37, lokasi: "GENBA C NEW", zona: "7" },
  { no: 38, lokasi: "GENBA C NEW", zona: "7" },
  { no: 39, lokasi: "GENBA C NEW", zona: "7" },
  { no: 40, lokasi: "GENBA C NEW", zona: "7" },
  { no: 41, lokasi: "GENBA C NEW", zona: "7" },
  { no: 42, lokasi: "GENBA C NEW", zona: "7" },
  { no: 43, lokasi: "GENBA C NEW", zona: "7" },
  { no: 44, lokasi: "GENBA C NEW", zona: "7" },
  { no: 45, lokasi: "GENBA C NEW", zona: "7" },
  { no: 46, lokasi: "GENBA C NEW", zona: "7" },
  { no: 47, lokasi: "GENBA C NEW", zona: "7" },
  { no: 48, lokasi: "GENBA C NEW", zona: "7" },
  { no: 49, lokasi: "GENBA C NEW", zona: "7" },
  { no: 50, lokasi: "MAINTENANCE OFFICE", zona: "6" },
  { no: 51, lokasi: "MAINTENANCE OFFICE", zona: "6" },
  { no: 52, lokasi: "MAINTENANCE OFFICE", zona: "6" },
  { no: 53, lokasi: "TRAINING", zona: "6" },
  { no: 54, lokasi: "TRAINING", zona: "6" },
  { no: 55, lokasi: "MEETING ROOM D", zona: "6" },
  { no: 56, lokasi: "DINING ROOM", zona: "6" },
  { no: 57, lokasi: "PUMP ROOM", zona: "8" },
  { no: 58, lokasi: "COMPRESSOR", zona: "9" },
  { no: 59, lokasi: "PANEL ROOM (POWER HOUSE A)", zona: "9" },
  { no: 60, lokasi: "CANTEEN", zona: "10" },
  { no: 61, lokasi: "CANTEEN", zona: "10" },
  { no: 62, lokasi: "CANTEEN", zona: "10" },
  { no: 63, lokasi: "CANTEEN", zona: "10" },
  { no: 64, lokasi: "CANTEEN", zona: "10" },
  { no: 65, lokasi: "CANTEEN", zona: "10" },
  { no: 66, lokasi: "CANTEEN", zona: "10" },
  { no: 67, lokasi: "CANTEEN", zona: "10" },
  { no: 68, lokasi: "CANTEEN", zona: "10" },
  { no: 69, lokasi: "CANTEEN", zona: "10" },
  { no: 70, lokasi: "CANTEEN", zona: "10" },
  { no: 71, lokasi: "CANTEEN", zona: "10" },
  { no: 72, lokasi: "CANTEEN", zona: "10" },
  { no: 73, lokasi: "CANTEEN", zona: "10" },
  { no: 74, lokasi: "CANTEEN", zona: "10" },
  { no: 75, lokasi: "CANTEEN", zona: "10" },
  { no: 76, lokasi: "CANTEEN", zona: "10" },
  { no: 77, lokasi: "CANTEEN", zona: "10" },
  { no: 78, lokasi: "CANTEEN", zona: "10" },
  { no: 79, lokasi: "CANTEEN", zona: "10" },
  { no: 80, lokasi: "CANTEEN", zona: "10" },
  { no: 81, lokasi: "CANTEEN", zona: "10" },
  { no: 82, lokasi: "CANTEEN", zona: "10" },
  { no: 83, lokasi: "CANTEEN", zona: "10" },
  { no: 84, lokasi: "CANTEEN", zona: "10" },
  { no: 85, lokasi: "CANTEEN", zona: "10" },
  { no: 86, lokasi: "CANTEEN", zona: "10" },
  { no: 87, lokasi: "CANTEEN", zona: "10" },
  { no: 88, lokasi: "CANTEEN", zona: "10" },
  { no: 89, lokasi: "CANTEEN", zona: "10" },
  { no: 90, lokasi: "CANTEEN", zona: "10" },
  { no: 91, lokasi: "CANTEEN", zona: "10" },
  { no: 92, lokasi: "CANTEEN", zona: "10" },
  { no: 93, lokasi: "CANTEEN", zona: "10" },
  { no: 94, lokasi: "CANTEEN", zona: "10" },
  { no: 95, lokasi: "CANTEEN", zona: "10" },
  { no: 96, lokasi: "CANTEEN", zona: "10" },
  { no: 97, lokasi: "CANTEEN", zona: "10" },
  { no: 98, lokasi: "CANTEEN", zona: "10" },
  { no: 99, lokasi: "CANTEEN", zona: "10" },
  { no: 100, lokasi: "CANTEEN", zona: "10" },
  { no: 101, lokasi: "CANTEEN", zona: "10" },
  { no: 102, lokasi: "TOKO GABUS", zona: "10" },
  { no: 103, lokasi: "KOPKAR", zona: "10" },
  { no: 104, lokasi: "AUDITORIUM", zona: "11" },
  { no: 105, lokasi: "AUDITORIUM", zona: "11" },
  { no: 106, lokasi: "AUDITORIUM", zona: "11" },
  { no: 107, lokasi: "AUDITORIUM", zona: "11" },
  { no: 108, lokasi: "AUDITORIUM", zona: "11" },
  { no: 109, lokasi: "AUDITORIUM", zona: "11" },
  { no: 110, lokasi: "AUDITORIUM MEETING A", zona: "11" },
  { no: 111, lokasi: "AUDITORIUM MEETING B", zona: "11" },
  { no: 112, lokasi: "POWER HOUSE B", zona: "14" },
  { no: 113, lokasi: "RUANG CAPASITOR (POWER HOUSE B)", zona: "14" },
  { no: 114, lokasi: "RUANG COMPRESSOR (POWER HOUSE B)", zona: "14" },
  { no: 115, lokasi: "POWER HOUSE B", zona: "14" },
  { no: 116, lokasi: "SCAN IN EXIM NEW", zona: "15" },
  { no: 117, lokasi: "GENBA A NEW", zona: "15" },
  { no: 118, lokasi: "GENBA A NEW", zona: "15" },
  { no: 119, lokasi: "GENBA A NEW", zona: "15" },
  { no: 120, lokasi: "GENBA A NEW", zona: "15" },
  { no: 121, lokasi: "GENBA A NEW", zona: "15" },
  { no: 122, lokasi: "GENBA A NEW", zona: "15" },
  { no: 123, lokasi: "GENBA A NEW", zona: "15" },
  { no: 124, lokasi: "GENBA A NEW", zona: "15" },
  { no: 125, lokasi: "GENBA A NEW", zona: "15" },
  { no: 126, lokasi: "GENBA A NEW", zona: "15" },
  { no: 127, lokasi: "GENBA A NEW", zona: "15" },
  { no: 128, lokasi: "GENBA A NEW", zona: "15" },
  { no: 129, lokasi: "GENBA A NEW", zona: "15" },
  { no: 130, lokasi: "GENBA A NEW", zona: "15" },
  { no: 131, lokasi: "GENBA A NEW", zona: "15" },
  { no: 132, lokasi: "GENBA A NEW", zona: "15" },
  { no: 133, lokasi: "GENBA A NEW", zona: "15" },
  { no: 134, lokasi: "GENBA A NEW", zona: "15" },
  { no: 135, lokasi: "GENBA A NEW", zona: "15" },
  { no: 136, lokasi: "GENBA A NEW", zona: "15" },
  { no: 137, lokasi: "GENBA A NEW", zona: "15" },
  { no: 138, lokasi: "GENBA A NEW", zona: "15" },
  { no: 139, lokasi: "GENBA A NEW", zona: "15" },
  { no: 140, lokasi: "GENBA A NEW", zona: "15" },
  { no: 141, lokasi: "GENBA A NEW", zona: "18" },
  { no: 142, lokasi: "GENBA A NEW", zona: "18" },
  { no: 143, lokasi: "GENBA A NEW", zona: "18" },
  { no: 144, lokasi: "GENBA A NEW", zona: "18" },
  { no: 145, lokasi: "GENBA A NEW", zona: "18" },
  { no: 146, lokasi: "GENBA A NEW", zona: "18" },
  { no: 147, lokasi: "GENBA A NEW", zona: "18" },
  { no: 148, lokasi: "GENBA A NEW", zona: "18" },
  { no: 149, lokasi: "GENBA A NEW", zona: "18" },
  { no: 150, lokasi: "GENBA A NEW", zona: "18" },
  { no: 151, lokasi: "GENBA A NEW", zona: "18" },
  { no: 152, lokasi: "GENBA A NEW", zona: "18" },
  { no: 153, lokasi: "GENBA A NEW", zona: "18" },
  { no: 154, lokasi: "GENBA A NEW", zona: "18" },
  { no: 155, lokasi: "GENBA A NEW", zona: "18" },
  { no: 156, lokasi: "GENBA A NEW", zona: "18" },
  { no: 157, lokasi: "GENBA A NEW", zona: "18" },
  { no: 158, lokasi: "GENBA A NEW", zona: "18" },
  { no: 159, lokasi: "GENBA A NEW", zona: "18" },
  { no: 160, lokasi: "GENBA A NEW", zona: "18" },
  { no: 161, lokasi: "GENBA A NEW", zona: "18" },
  { no: 162, lokasi: "GENBA A NEW", zona: "18" },
  { no: 163, lokasi: "GENBA A NEW", zona: "18" },
  { no: 164, lokasi: "GENBA A NEW", zona: "18" },
  { no: 165, lokasi: "GENBA A NEW", zona: "18" },
  { no: 166, lokasi: "GENBA A NEW", zona: "18" },
  { no: 167, lokasi: "GENBA A NEW", zona: "18" },
  { no: 168, lokasi: "GENBA A NEW", zona: "18" },
  { no: 169, lokasi: "GENBA A NEW", zona: "18" },
  { no: 170, lokasi: "GENBA A NEW", zona: "18" },
  { no: 171, lokasi: "GENBA A NEW", zona: "18" },
  { no: 172, lokasi: "GENBA A NEW", zona: "18" },
  { no: 173, lokasi: "GENBA A NEW", zona: "19" },
  { no: 174, lokasi: "GENBA A NEW", zona: "19" },
  { no: 175, lokasi: "GENBA A NEW", zona: "19" },
  { no: 176, lokasi: "GENBA A NEW", zona: "19" },
  { no: 177, lokasi: "GENBA A NEW", zona: "19" },
  { no: 178, lokasi: "GENBA A NEW", zona: "19" },
  { no: 179, lokasi: "GENBA A NEW", zona: "19" },
  { no: 180, lokasi: "GENBA A NEW", zona: "19" },
  { no: 181, lokasi: "GENBA A NEW", zona: "19" },
  { no: 182, lokasi: "GENBA A NEW", zona: "19" },
  { no: 183, lokasi: "GENBA A NEW", zona: "19" },
  { no: 184, lokasi: "GENBA A NEW", zona: "19" },
  { no: 185, lokasi: "GENBA A NEW", zona: "19" },
  { no: 186, lokasi: "GENBA A NEW", zona: "19" },
  { no: 187, lokasi: "GENBA A NEW", zona: "19" },
  { no: 188, lokasi: "GENBA A NEW", zona: "19" },
  { no: 189, lokasi: "GENBA A NEW", zona: "19" },
  { no: 190, lokasi: "GENBA A NEW", zona: "19" },
  { no: 191, lokasi: "GENBA A NEW", zona: "19" },
  { no: 192, lokasi: "GENBA A NEW", zona: "19" },
  { no: 193, lokasi: "GENBA A NEW", zona: "19" },
  { no: 194, lokasi: "GENBA A NEW", zona: "19" },
  { no: 195, lokasi: "GENBA A NEW", zona: "19" },
  { no: 196, lokasi: "GENBA A NEW", zona: "19" },
  { no: 197, lokasi: "GENBA A NEW", zona: "19" },
  { no: 198, lokasi: "GENBA A NEW", zona: "19" },
  { no: 199, lokasi: "GENBA A NEW", zona: "19" },
  { no: 200, lokasi: "GENBA A NEW", zona: "19" },
  { no: 201, lokasi: "GENBA A NEW", zona: "20" },
  { no: 202, lokasi: "GENBA A NEW", zona: "20" },
  { no: 203, lokasi: "GENBA A NEW", zona: "20" },
  { no: 204, lokasi: "GENBA A NEW", zona: "20" },
  { no: 205, lokasi: "GENBA A NEW", zona: "20" },
  { no: 206, lokasi: "GENBA A NEW", zona: "20" },
  { no: 207, lokasi: "GENBA A NEW", zona: "20" },
  { no: 208, lokasi: "GENBA A NEW", zona: "20" },
  { no: 209, lokasi: "GENBA A NEW", zona: "20" },
  { no: 210, lokasi: "GENBA A NEW", zona: "20" },
  { no: 211, lokasi: "GENBA A NEW", zona: "20" },
  { no: 212, lokasi: "GENBA A NEW", zona: "20" },
  { no: 213, lokasi: "GENBA A NEW", zona: "20" },
  { no: 214, lokasi: "GENBA A NEW", zona: "20" },
  { no: 215, lokasi: "GENBA A NEW", zona: "20" },
  { no: 216, lokasi: "GENBA A NEW", zona: "20" },
  { no: 217, lokasi: "GENBA A NEW", zona: "20" },
  { no: 218, lokasi: "GENBA A NEW", zona: "20" },
  { no: 219, lokasi: "GENBA A NEW", zona: "20" },
  { no: 220, lokasi: "GENBA A NEW", zona: "20" },
  { no: 221, lokasi: "GENBA A NEW", zona: "20" },
  { no: 222, lokasi: "GENBA A NEW", zona: "20" },
  { no: 223, lokasi: "GENBA A NEW", zona: "20" },
  { no: 224, lokasi: "GENBA A NEW", zona: "20" },
  { no: 225, lokasi: "GENBA A NEW", zona: "20" },
  { no: 226, lokasi: "GENBA A NEW", zona: "20" },
  { no: 227, lokasi: "GENBA A NEW", zona: "20" },
  { no: 228, lokasi: "GENBA A NEW", zona: "20" },
  { no: 229, lokasi: "GENBA A NEW", zona: "21" },
  { no: 230, lokasi: "GENBA A NEW", zona: "21" },
  { no: 231, lokasi: "GENBA A NEW", zona: "21" },
  { no: 232, lokasi: "GENBA A NEW", zona: "21" },
  { no: 233, lokasi: "GENBA A NEW", zona: "21" },
  { no: 234, lokasi: "GENBA A NEW", zona: "21" },
  { no: 235, lokasi: "GENBA A NEW", zona: "21" },
  { no: 236, lokasi: "GENBA A NEW", zona: "21" },
  { no: 237, lokasi: "GENBA A NEW", zona: "21" },
  { no: 238, lokasi: "GENBA A NEW", zona: "21" },
  { no: 239, lokasi: "GENBA A NEW", zona: "21" },
  { no: 240, lokasi: "GENBA A NEW", zona: "21" },
  { no: 241, lokasi: "GENBA A NEW", zona: "21" },
  { no: 242, lokasi: "GENBA A NEW", zona: "21" },
  { no: 243, lokasi: "GENBA A NEW", zona: "21" },
  { no: 244, lokasi: "GENBA A NEW", zona: "21" },
  { no: 245, lokasi: "GENBA A NEW", zona: "21" },
  { no: 246, lokasi: "GENBA A NEW", zona: "21" },
  { no: 247, lokasi: "GENBA A NEW", zona: "21" },
  { no: 248, lokasi: "GENBA A NEW", zona: "21" },
  { no: 249, lokasi: "GENBA A NEW", zona: "21" },
  { no: 250, lokasi: "GENBA A NEW", zona: "21" },
  { no: 251, lokasi: "GENBA A NEW", zona: "21" },
  { no: 252, lokasi: "GENBA A NEW", zona: "21" },
  { no: 253, lokasi: "GENBA A NEW", zona: "21" },
  { no: 254, lokasi: "GENBA A NEW", zona: "21" },
  { no: 255, lokasi: "GENBA A NEW", zona: "21" },
  { no: 256, lokasi: "GENBA A NEW", zona: "21" },
  { no: 257, lokasi: "GENBA A NEW", zona: "22" },
  { no: 258, lokasi: "GENBA A NEW", zona: "22" },
  { no: 259, lokasi: "GENBA A NEW", zona: "22" },
  { no: 260, lokasi: "GENBA A NEW", zona: "22" },
  { no: 261, lokasi: "GENBA A NEW", zona: "22" },
  { no: 262, lokasi: "GENBA A NEW", zona: "22" },
  { no: 263, lokasi: "GENBA A NEW", zona: "22" },
  { no: 264, lokasi: "GENBA A NEW", zona: "22" },
  { no: 265, lokasi: "GENBA A NEW", zona: "22" },
  { no: 266, lokasi: "GENBA A NEW", zona: "22" },
  { no: 267, lokasi: "GENBA A NEW", zona: "22" },
  { no: 268, lokasi: "GENBA A NEW", zona: "22" },
  { no: 269, lokasi: "GENBA A NEW", zona: "22" },
  { no: 270, lokasi: "GENBA A NEW", zona: "22" },
  { no: 271, lokasi: "GENBA A NEW", zona: "22" },
  { no: 272, lokasi: "GENBA A NEW", zona: "22" },
  { no: 273, lokasi: "GENBA A NEW", zona: "22" },
  { no: 274, lokasi: "GENBA A NEW", zona: "22" },
  { no: 275, lokasi: "GENBA A NEW", zona: "22" },
  { no: 276, lokasi: "GENBA A NEW", zona: "22" },
  { no: 277, lokasi: "GENBA A NEW", zona: "22" },
  { no: 278, lokasi: "GENBA A NEW", zona: "22" },
  { no: 279, lokasi: "GENBA A NEW", zona: "22" },
  { no: 280, lokasi: "GENBA A NEW", zona: "22" },
  { no: 281, lokasi: "GENBA A NEW", zona: "22" },
  { no: 282, lokasi: "GENBA A NEW", zona: "22" },
  { no: 283, lokasi: "GENBA A NEW", zona: "22" },
  { no: 284, lokasi: "GENBA A NEW", zona: "22" },
  { no: 285, lokasi: "NEW WAREHOUSE NEW", zona: "22" },
  { no: 286, lokasi: "NEW WAREHOUSE NEW", zona: "22" },
  { no: 287, lokasi: "NEW WAREHOUSE NEW", zona: "22" },
]

const FIXED_TEMP_HEAT_DETECTOR_LIST: DetectorItem[] = [
  { no: 1, lokasi: "PANTRY", zona: "1" },
  { no: 2, lokasi: "GENSET A", zona: "9" },
  { no: 3, lokasi: "GENSET C", zona: "9" },
  { no: 4, lokasi: "TRAFO", zona: "9" },
  { no: 5, lokasi: "PANEL GENBA C", zona: "9" },
  { no: 6, lokasi: "GENSET (POWER HOUSE B)", zona: "14" },
  { no: 7, lokasi: "GENSET (POWER HOUSE B)", zona: "14" },
]

export default function GaSmokeDetectorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [isMounted, setIsMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("SMOKE DETECTOR") // default
  const [searchTerm, setSearchTerm] = useState<string>("")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user || (user.role !== "group-leader-qa" && user.role !== "inspector-ga")) {
      router.push("/login-page")
    }
  }, [user, loading, router])

  const getCategoryList = (): DetectorItem[] => {
    switch (selectedCategory) {
      case "ROR HEAT DETECTOR":
        return ROR_HEAT_DETECTOR_LIST
      case "FIXED TEMPERATUR HEAT DETECTOR":
        return FIXED_TEMP_HEAT_DETECTOR_LIST
      default:
        return SMOKE_DETECTOR_LIST
    }
  }

  const filteredData = getCategoryList().filter(item =>
    item.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.zona.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentList = getCategoryList()

  const [selectedArea, setSelectedArea] = useState<DetectorItem | null>(null)
  const [checksheetData, setChecksheetData] = useState<any | null>(null)
  const [selectedDateInModal, setSelectedDateInModal] = useState<string>("")
  const [availableDates, setAvailableDates] = useState<string[]>([])

  const openDetail = (area: DetectorItem) => {
    setSelectedArea(area)
    const key = `e-checksheet-smoke-detector-${area.no}`
    const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setChecksheetData(data)

        const allDates = new Set<string>()
        if (Array.isArray(data)) {
          data.forEach((entry: any) => {
            if (entry?.date) allDates.add(entry.date)
          })
        }
        const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        setAvailableDates(sortedDates)
        setSelectedDateInModal(sortedDates[0] || "")
      } catch (e) {
        setChecksheetData(null)
        setAvailableDates([])
        setSelectedDateInModal("")
      }
    } else {
      setChecksheetData(null)
      setAvailableDates([])
      setSelectedDateInModal("")
    }
    setShowModal(true)
  }

  const closeDetail = () => {
    setSelectedArea(null)
    setChecksheetData(null)
    setSelectedDateInModal("")
    setAvailableDates([])
    setShowModal(false)
  }

  if (!isMounted) return null

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
    return null
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <NavbarStatic userName={user?.fullName || "User"} />
      <div style={{ padding: "24px 20px", maxWidth: "1400px", margin: "0 auto" }}>
        
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "24px 28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              🚨 Smoke & Heat Detector Inspection
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px", fontWeight: "400" }}>
              Bi-monthly inspection schedule and maintenance records
            </p>
          </div>
        </div>

        {/* Dropdown Filter */}
        {/* Dropdown + Search */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "flex-end"
        }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label htmlFor="category-select" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
              Detector Type:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                border: "1px solid #d0d0d0",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333",
                outline: "none",
                fontFamily: "inherit"
              }}
            >
              <option value="SMOKE DETECTOR">SMOKE DETECTOR</option>
              <option value="ROR HEAT DETECTOR">ROR HEAT DETECTOR</option>
              <option value="FIXED TEMPERATUR HEAT DETECTOR">FIXED TEMPERATUR HEAT DETECTOR</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <label htmlFor="search-input" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
              Search Location or Zone:
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="e.g. LOBBY, CANTEEN, Zona 10..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                border: "1px solid #d0d0d0",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333",
                outline: "none",
                fontFamily: "inherit"
              }}
            />
          </div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Location</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Zone</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area, idx) => {
                  const key = `e-checksheet-smoke-detector-${area.no}`
                  const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
                  let statusLabel = "No Data"
                  let statusColor = "#757575"
                  let lastCheck = "-"

                  if (saved) {
                    try {
                      const data = JSON.parse(saved)
                      if (Array.isArray(data) && data.length > 0) {
                        const latest = data[0].date
                        lastCheck = new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        statusLabel = "Checked"
                        statusColor = "#43a047"
                      }
                    } catch {}
                  }

                  return (
                    <tr key={area.no} style={{ borderBottom: idx === currentList.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{area.lokasi}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>{area.zona}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <span style={{
                            padding: "4px 12px",
                            background: statusColor,
                            color: "white",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            display: "inline-block"
                          }}>
                            {statusLabel}
                          </span>
                          <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{lastCheck}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => openDetail(area)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: "5px",
                              fontSize: "13px",
                              fontWeight: "500",
                              background: "#1976d2",
                              color: "white",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            View
                          </button>
                          <a
                            href={`/e-checksheet-smoke-detector?no=${area.no}&lokasi=${encodeURIComponent(area.lokasi)}&zona=${encodeURIComponent(area.zona)}`}
                            style={{
                              padding: "7px 14px",
                              borderRadius: "5px",
                              fontSize: "13px",
                              fontWeight: "500",
                              background: "#43a047",
                              color: "white",
                              textDecoration: "none",
                              display: "inline-block"
                            }}
                          >
                            Inspect
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal remains unchanged — already compatible */}
        {showModal && selectedArea && (
          <div
            onClick={closeDetail}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "8px",
                width: "95%",
                maxWidth: "1400px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                background: "#f5f5f5",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", color: "#212121", fontSize: "20px", fontWeight: "600" }}>
                    Inspection History - Unit #{selectedArea.no}
                  </h2>
                  <p style={{ margin: "0", color: "#616161", fontSize: "14px" }}>
                    {selectedArea.lokasi} • Zone {selectedArea.zona}
                  </p>
                </div>
                <button 
                  onClick={closeDetail} 
                  style={{ 
                    background: "transparent", 
                    border: "none", 
                    fontSize: "28px", 
                    cursor: "pointer", 
                    color: "#757575",
                    padding: "0",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: "16px 24px", background: "white", borderBottom: "1px solid #e0e0e0" }}>
                <label style={{ fontWeight: "500", color: "#424242", marginRight: "12px", fontSize: "14px" }}>
                  Inspection Date:
                </label>
                <select
                  value={selectedDateInModal}
                  onChange={(e) => setSelectedDateInModal(e.target.value)}
                  style={{
                    color: "#212121",
                    padding: "7px 12px",
                    border: "1px solid #d0d0d0",
                    borderRadius: "5px",
                    fontSize: "14px",
                    fontWeight: "500",
                    minWidth: "160px",
                    outline: "none"
                  }}
                >
                  <option value="">Select date</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ padding: "24px", overflowY: "auto", flex: 1, background: "#fafafa" }}>
                {!checksheetData || !Array.isArray(checksheetData) || checksheetData.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e9e9e" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📋</div>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>No inspection records found</p>
                  </div>
                ) : !selectedDateInModal ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#757575" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📅</div>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>Please select an inspection date</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    {(() => {
                      const entry = checksheetData.find((e: any) => e.date === selectedDateInModal)
                      if (!entry) {
                        return <div style={{ textAlign: "center", padding: "40px", color: "#9e9e9e" }}>No data found for this date</div>
                      }
                      return (
                        <div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "1200px", border: "1px solid #e0e0e0", background: "white" }}>
                            <thead>
                              <tr style={{ background: "#f5f5f5" }}>
                                <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "12%" }}>Alarm Bell</th>
                                <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "12%" }}>Indicator Lamp</th>
                                <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "12%" }}>Cleanliness</th>
                                <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "18%" }}>Findings</th>
                                <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "18%" }}>Corrective Action</th>
                                <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>PIC</th>
                                <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>Due Date</th>
                                <th style={{ padding: "12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "8%" }}>Verify</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{
                                  padding: "12px",
                                  border: "1px solid #e0e0e0",
                                  textAlign: "center",
                                  fontWeight: "600",
                                  background: entry.alarmBell === "OK" ? "#e8f5e9" : entry.alarmBell === "NG" ? "#ffebee" : "#fff",
                                  color: entry.alarmBell === "OK" ? "#2e7d32" : entry.alarmBell === "NG" ? "#c62828" : "#757575"
                                }}>
                                  {entry.alarmBell || "-"}
                                </td>
                                <td style={{
                                  padding: "12px",
                                  border: "1px solid #e0e0e0",
                                  textAlign: "center",
                                  fontWeight: "600",
                                  background: entry.indicatorLamp === "OK" ? "#e8f5e9" : entry.indicatorLamp === "NG" ? "#ffebee" : "#fff",
                                  color: entry.indicatorLamp === "OK" ? "#2e7d32" : entry.indicatorLamp === "NG" ? "#c62828" : "#757575"
                                }}>
                                  {entry.indicatorLamp || "-"}
                                </td>
                                <td style={{
                                  padding: "12px",
                                  border: "1px solid #e0e0e0",
                                  textAlign: "center",
                                  fontWeight: "600",
                                  background: entry.kebersihan === "OK" ? "#e8f5e9" : entry.kebersihan === "NG" ? "#ffebee" : "#fff",
                                  color: entry.kebersihan === "OK" ? "#2e7d32" : entry.kebersihan === "NG" ? "#c62828" : "#757575"
                                }}>
                                  {entry.kebersihan || "-"}
                                </td>
                                <td style={{ padding: "12px", border: "1px solid #e0e0e0", lineHeight: "1.5", color: "#424242" }}>{entry.keteranganKondisi || "-"}</td>
                                <td style={{ padding: "12px", border: "1px solid #e0e0e0", lineHeight: "1.5", color: "#424242" }}>{entry.tindakanPerbaikan || "-"}</td>
                                <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "500", color: "#424242" }}>{entry.pic || "-"}</td>
                                <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center", color: "#616161" }}>
                                  {entry.dueDate ? new Date(entry.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "-"}
                                </td>
                                <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center", color: "#616161" }}>{entry.verify || "-"}</td>
                              </tr>
                            </tbody>
                          </table>
                          
                          <div style={{ marginTop: "20px", padding: "16px", background: "#f9f9f9", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#757575" }}>Inspector</p>
                            <p style={{ margin: "0", fontSize: "14px", fontWeight: "500", color: "#424242" }}>{entry.inspector || "N/A"}</p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 24px", background: "#f5f5f5", borderTop: "1px solid #e0e0e0", textAlign: "right" }}>
                <button 
                  onClick={closeDetail} 
                  style={{ 
                    padding: "9px 20px", 
                    background: "#757575", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "5px", 
                    fontWeight: "500",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}