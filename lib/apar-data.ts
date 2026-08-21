// lib/apar-data.ts

// Type definition for APAR data including hydrotestDate
export type AparDataItem = {
  no: number;
  jenisApar: string;
  lokasi: string;
  noApar: string;
  expDate: string;
  hydrotestDate?: string;
};

export const aparDataBySlug: Record<string, AparDataItem[]> = {
  "area-locker-security": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "SECURITY", noApar: "1", expDate: "14/3/2028", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "LOCKER", noApar: "2", expDate: "26/9/2027", hydrotestDate: "" }
  ],
  "area-kantin": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU MASUK KANTIN", noApar: "3", expDate: "12/12/2027", hydrotestDate: "" },
    { no: 2, jenisApar: "DRY CHEMICAL POWDER 25 kg", lokasi: "PINTU KELUAR KANTIN", noApar: "4", expDate: "25/7/2027", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU KELUAR KANTIN", noApar: "4A", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "PANEL KANTIN", noApar: "4B", expDate: "10/5/2030", hydrotestDate: "" }
  ],
  "area-auditorium": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "AUDITORIUM (SEBELAH PINTU MASUK)", noApar: "5", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "AUDITORIUM", noApar: "6", expDate: "26/4/2026", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "AUDITORIUM", noApar: "7", expDate: "26/4/2026", hydrotestDate: "" }
  ],
  "area-main-office": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "LOBBY", noApar: "8", expDate: "29/7/2027", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "MAIN OFFICE SISI UTARA", noApar: "9", expDate: "20/9/2026", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU MASUK SISI TIMUR", noApar: "9A", expDate: "7/7/2030", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "MAIN OFFICE SISI SELATAN", noApar: "10", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 5, jenisApar: "GAS CAIR 6 kg", lokasi: "DEPAN PINTU SISI BARAT", noApar: "10A", expDate: "26/9/2027", hydrotestDate: "" },
    { no: 6, jenisApar: "GAS CAIR 6 kg", lokasi: "PANEL OFFICE", noApar: "11", expDate: "23/7/2028", hydrotestDate: "" },
    { no: 8, jenisApar: "CO2 3,2 kg", lokasi: "IT", noApar: "12", expDate: "2/2/2026", hydrotestDate: "" }
  ],
  "exim": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "DEPAN OFFICE EXIM", noApar: "13", expDate: "26/9/2027", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "LOADING DOCK EXIM PINTU 12", noApar: "14", expDate: "12/12/2027", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "LOADING DOCK EXIM SISI TIMUR", noApar: "15", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "SECOND EXIM FLOOR", noApar: "15A", expDate: "14/3/2028", hydrotestDate: "" },
    { no: 5, jenisApar: "GAS CAIR 6 kg", lokasi: "SECOND EXIM FLOOR", noApar: "15B", expDate: "8/10/2026", hydrotestDate: "" }
  ],
  "area-genba-a": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "(PINTU 9)", noApar: "16", expDate: "27/12/2025", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "CONV AT1", noApar: "17", expDate: "30/6/2030", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AT 1", noApar: "18", expDate: "19/2/2029", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB 1", noApar: "19", expDate: "26/9/2027", hydrotestDate: "" },
    { no: 5, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB 1 (TENGAH)", noApar: "20", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 6, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU 1 GENBA A", noApar: "21", expDate: "18/3/2030", hydrotestDate: "" },
    { no: 7, jenisApar: "GAS CAIR 6 kg", lokasi: "PANEL LP3", noApar: "22", expDate: "24/3/2027", hydrotestDate: "" },
    { no: 8, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB 6", noApar: "23", expDate: "7/1/2026", hydrotestDate: "" },
    { no: 10, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB3", noApar: "25", expDate: "18/3/2030", hydrotestDate: "" },
    { no: 11, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AT2", noApar: "26", expDate: "30/8/2029", hydrotestDate: "" },
    { no: 12, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AT2", noApar: "27", expDate: "7/5/2026", hydrotestDate: "" },
    { no: 13, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AT6", noApar: "28", expDate: "22/7/2028", hydrotestDate: "" },
    { no: 14, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AT6", noApar: "29", expDate: "10/12/2025", hydrotestDate: "" },
    { no: 15, jenisApar: "GAS CAIR 6 kg", lokasi: "SUB ASSY CV AT6", noApar: "30", expDate: "24/2/2028", hydrotestDate: "" },
    { no: 16, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AT 6", noApar: "31", expDate: "5/1/2026", hydrotestDate: "" },
    { no: 17, jenisApar: "GAS CAIR 6 kg", lokasi: "REL TRANSPORTER AB6", noApar: "32", expDate: "22/07/2028", hydrotestDate: "" },
    { no: 18, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB 6", noApar: "33", expDate: "18/3/2030", hydrotestDate: "" },
    { no: 19, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB 8", noApar: "34", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 20, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU 2", noApar: "35", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 21, jenisApar: "GAS CAIR 6 kg", lokasi: "PA MAZDA AB8", noApar: "36", expDate: "8/10/2026", hydrotestDate: "" },
    { no: 22, jenisApar: "GAS CAIR 6 kg", lokasi: "AT7", noApar: "37", expDate: "7/7/2030", hydrotestDate: "" },
    { no: 23, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AT 7", noApar: "38", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 24, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU 8", noApar: "39", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 25, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AT 9", noApar: "40", expDate: "7/7/2030", hydrotestDate: "" },
    { no: 27, jenisApar: "GAS CAIR 6 kg", lokasi: "AT9", noApar: "42", expDate: "12/12/2027", hydrotestDate: "" },
    { no: 28, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB 9", noApar: "43", expDate: "8/10/2026", hydrotestDate: "" },
    { no: 29, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB 11", noApar: "44", expDate: "12/12/2027", hydrotestDate: "" },
    { no: 30, jenisApar: "GAS CAIR 6 kg", lokasi: "PANEL LP 2", noApar: "45", expDate: "24/2/2028", hydrotestDate: "" },
    { no: 31, jenisApar: "GAS CAIR 6 kg", lokasi: "SA / AB11", noApar: "46", expDate: "18/3/2030", hydrotestDate: "" },
    { no: 32, jenisApar: "GAS CAIR 6 kg", lokasi: "M/S CV AB11", noApar: "47", expDate: "26/9/2027", hydrotestDate: "" },
    { no: 33, jenisApar: "GAS CAIR 6 kg", lokasi: "AT11", noApar: "48", expDate: "18/3/2030", hydrotestDate: "" },
    { no: 34, jenisApar: "GAS CAIR 6 kg", lokasi: "PA 900B TIMUR / PANEL PP6", noApar: "49", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 35, jenisApar: "GAS CAIR 6 kg", lokasi: "PP10", noApar: "50", expDate: "7/7/2030", hydrotestDate: "" },
    { no: 36, jenisApar: "GAS CAIR 6 kg", lokasi: "BONDER 900", noApar: "51", expDate: "9/12/2029", hydrotestDate: "" },
    { no: 37, jenisApar: "GAS CAIR 6 kg", lokasi: "REWORK TIMUR", noApar: "52", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 38, jenisApar: "GAS CAIR 6 kg", lokasi: "TRANSPORTER 02 AB14", noApar: "53", expDate: "15/8/2028", hydrotestDate: "" },
    { no: 39, jenisApar: "GAS CAIR 6 kg", lokasi: "BLKG DUCT SUB ASSY CV AB14", noApar: "54", expDate: "9/10/2027", hydrotestDate: "" },
    { no: 40, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB 14", noApar: "55", expDate: "12/12/2027", hydrotestDate: "" },
    { no: 41, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU 3", noApar: "56", expDate: "26/09/2027", hydrotestDate: "" },
    { no: 42, jenisApar: "GAS CAIR 6 kg", lokasi: "BATTERY CABLE (BCL)", noApar: "57", expDate: "12/12/2027", hydrotestDate: "" },
    { no: 43, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AB16", noApar: "58", expDate: "7/7/2030", hydrotestDate: "" },
    { no: 44, jenisApar: "GAS CAIR 6 kg", lokasi: "CV AT16", noApar: "59", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 46, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU 7", noApar: "61", expDate: "9/10/2027", hydrotestDate: "" },
    { no: 47, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU 7", noApar: "62", expDate: "22/7/2028", hydrotestDate: "" },
    { no: 48, jenisApar: "GAS CAIR 6 kg", lokasi: "INSPECT AT18", noApar: "63", expDate: "19/2/2029", hydrotestDate: "" },
    { no: 49, jenisApar: "GAS CAIR 6 kg", lokasi: "STORE AT 18", noApar: "64", expDate: "10/12/2025", hydrotestDate: "" },
    { no: 50, jenisApar: "GAS CAIR 6 kg", lokasi: "MINI STORE NISSAN WAREHOUSE", noApar: "65", expDate: "14/10/2027", hydrotestDate: "" },
    { no: 51, jenisApar: "GAS CAIR 6 kg", lokasi: "WAREHOUSE", noApar: "66", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 52, jenisApar: "GAS CAIR 6 kg", lokasi: "SCAN KANBAN WHS", noApar: "67", expDate: "14/3/2028", hydrotestDate: "" },
    { no: 53, jenisApar: "GAS CAIR 6 kg", lokasi: "MS AT19", noApar: "68", expDate: "7/7/2030", hydrotestDate: "" },
    { no: 55, jenisApar: "GAS CAIR 6 kg", lokasi: "WAREHOUSE TIMUR", noApar: "69A", expDate: "29/7/2028", hydrotestDate: "" },
    { no: 56, jenisApar: "GAS CAIR 6 kg", lokasi: "RECEIVING AREA 09 WHS", noApar: "70", expDate: "11/12/2029", hydrotestDate: "" },
    { no: 57, jenisApar: "GAS CAIR 6 kg", lokasi: "RECEIVING AREA 01 WHS", noApar: "71", expDate: "11/12/2029", hydrotestDate: "" },
    { no: 58, jenisApar: "GAS CAIR 6 kg", lokasi: "DEPAN PINTU OFFICE WHS", noApar: "71A", expDate: "11/12/2029", hydrotestDate: "" },
    { no: 59, jenisApar: "GAS CAIR 6 kg", lokasi: "DEPAN PINTU CHARGER FORKLIFT", noApar: "71B", expDate: "14/10/2027", hydrotestDate: "" },
    { no: 60, jenisApar: "GAS CAIR 6 kg", lokasi: "SAMPING LIFT BARANG WHS (SECOND FLOOR)", noApar: "71C", expDate: "26/9/2027", hydrotestDate: "" },
    { no: 61, jenisApar: "GAS CAIR 6 kg", lokasi: "SECOND FLOOR WHS PAGAR SELATAN", noApar: "71D", expDate: "14/03/2028", hydrotestDate: "" },
    { no: 62, jenisApar: "GAS CAIR 6 kg", lokasi: "SECOND FLOOR WHS PAGAR BARAT", noApar: "71E", expDate: "7/1/2026", hydrotestDate: "" }
  ],
  "area-mezzanine-genba-a": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE ACCE SUB-02", noApar: "72", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE RAYCHEM", noApar: "73", expDate: "10/12/2025", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE HW40.DPL-02", noApar: "74", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE CM.20 -J72.03", noApar: "75", expDate: "24/2/2028", hydrotestDate: "" },
    { no: 5, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE SS.10-DPL-01", noApar: "76", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 6, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE TIMUR UTARA", noApar: "77", expDate: "26/9/2027", hydrotestDate: "" },
    { no: 8, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE NISSAN T.03", noApar: "79", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 9, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE WT 11.J72-11", noApar: "80", expDate: "26/9/2027", hydrotestDate: "" },
    { no: 10, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE WT-11 SUB-11", noApar: "81", expDate: "17/12/2026", hydrotestDate: "" },
    { no: 11, jenisApar: "GAS CAIR 6 kg", lokasi: "MEZZANINE WT 11. SUB-14", noApar: "82", expDate: "14/3/2028", hydrotestDate: "" },
    { no: 12, jenisApar: "GAS CAIR 6 kg", lokasi: "TANGGA  MEZZANINE SISI SELATAN", noApar: "83", expDate: "14/3/2028", hydrotestDate: "" },
    { no: 13, jenisApar: "GAS CAIR 6 kg", lokasi: "TANGGA MEZZANINE ISI BARAT", noApar: "84", expDate: "15/9/2027", hydrotestDate: "" },
    { no: 14, jenisApar: "GAS CAIR 6 kg", lokasi: "TANGGA MEZZANINE SISI UTARA", noApar: "85", expDate: "26/9/2027", hydrotestDate: "" }
  ],
  "jig-proto-1-area-receiving": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "AREA RECEIVING (SEBELAH PINTU MASUK)", noApar: "86", expDate: "30/6/2026", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "FABRIKASI JP SISI BARAT", noApar: "87", expDate: "7/7/2026", hydrotestDate: "" }
  ],
  "stock-control-area": [
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "STOCK CONTROL AREA", noApar: "88", expDate: "18/7/2028", hydrotestDate: "" }
  ],
  "jig-proto-2-cnc-room": [
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "CNC ROOM", noApar: "89", expDate: "7/1/2026", hydrotestDate: "" },
    { no: 5, jenisApar: "GAS CAIR 6 kg", lokasi: "FABRIKASI C/B JP", noApar: "90", expDate: "7/7/2026", hydrotestDate: "" }
  ],
  "area-training-dining-mtc": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "TRAINING ROOM", noApar: "91", expDate: "11/12/2029", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "DINING ROOM", noApar: "92", expDate: "7/1/2026", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "UTILITY AREA", noApar: "93", expDate: "11/12/2029", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "SIMULASI TRAINING ROOM", noApar: "94", expDate: "7/1/2026", hydrotestDate: "" }
  ],
  "genba-c": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "AREA KANBAN (GENBA C)", noApar: "95", expDate: "20/9/2026", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "MATERIAL SUPPLY CV C4 (GENBA C)", noApar: "96", expDate: "23/7/2028", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "RAK MINUM CV C4 (GENBA C)", noApar: "97", expDate: "17/12/2026", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "RAK MINUM CV C7 (GENBA C)", noApar: "98", expDate: "9/10/2027", hydrotestDate: "" },
    { no: 5, jenisApar: "GAS CAIR 6 kg", lokasi: "CV C8 (GENBA C)", noApar: "99", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 6, jenisApar: "GAS CAIR 6 kg", lokasi: "KANBAN CV C8 (GENBA C)", noApar: "100", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 7, jenisApar: "GAS CAIR 6 kg", lokasi: "SUB ASSY CV C2 (GENBA C)", noApar: "101", expDate: "29/7/2028", hydrotestDate: "" },
    { no: 8, jenisApar: "GAS CAIR 6 kg", lokasi: "VISUAL CV C5 C (GENBA C)", noApar: "101A", expDate: "5/8/2027", hydrotestDate: "" },
    { no: 9, jenisApar: "GAS CAIR 6 kg", lokasi: "REYCHAM (GENBA C)", noApar: "102", expDate: "17/12/2026", hydrotestDate: "" },
    { no: 10, jenisApar: "GAS CAIR 6 kg", lokasi: "TENSILE TEST (GENBA C)", noApar: "103", expDate: "29/7/2028", hydrotestDate: "" },
    { no: 11, jenisApar: "GAS CAIR 6 kg", lokasi: "SUB ASSY CV C2 (GENBA C)", noApar: "104", expDate: "29/7/2028", hydrotestDate: "" },
    { no: 12, jenisApar: "GAS CAIR 6 kg", lokasi: "JALAN UTARA (GENBA C)", noApar: "104A", expDate: "14/3/2028", hydrotestDate: "" },
    { no: 13, jenisApar: "GAS CAIR 6 kg", lokasi: "STORE T10-B (GENBA C)", noApar: "105", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 14, jenisApar: "GAS CAIR 6 kg", lokasi: "AC 90 FTZ 01 (GENBA C)", noApar: "106", expDate: "8/10/2026", hydrotestDate: "" },
    { no: 15, jenisApar: "GAS CAIR 6 kg", lokasi: "M/S C1 (GENBA C)", noApar: "107", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 16, jenisApar: "GAS CAIR 6 kg", lokasi: "760W (GENBA C)", noApar: "108", expDate: "7/7/2026", hydrotestDate: "" },
    { no: 17, jenisApar: "GAS CAIR 6 kg", lokasi: "CV C5 (GENBA C)", noApar: "109", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 18, jenisApar: "GAS CAIR 6 kg", lokasi: "CV C5A (GENBA C)", noApar: "110", expDate: "29/7/2028", hydrotestDate: "" },
    { no: 19, jenisApar: "GAS CAIR 6 kg", lokasi: "JALAN SELATAN (GENBA C)", noApar: "110A", expDate: "10/5/2030", hydrotestDate: "" }
  ],
  "area-pump-room-warehouse": [
    { no: 1, jenisApar: "CO2 25 kg", lokasi: "MUSHOLLA GENBA C", noApar: "111", expDate: "9/1/2027", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "PUMP ROOM", noApar: "112", expDate: "10/5/2030", hydrotestDate: "" }
  ],
  "power-house-genba-a": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "COMPRESSOR RM", noApar: "113", expDate: "20/9/2026", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "GENSET RM", noApar: "114", expDate: "14/10/2027", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "TRAFO RM", noApar: "115", expDate: "10/5/2030", hydrotestDate: "" }
  ],
  "power-house-genba-c": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "TRAFO", noApar: "116", expDate: "7/1/2026", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "GENSET", noApar: "117", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 3, jenisApar: "DRY CHEMICAL POWDER 6 kg", lokasi: "BLKG SAMPING POWER HOUSE", noApar: "118", expDate: "16/7/2027", hydrotestDate: "" },
    { no: 4, jenisApar: "FOAM 6 kg", lokasi: "AREA SOLAR SISI BARAT", noApar: "118A", expDate: "27/12/2025", hydrotestDate: "" },
    { no: 5, jenisApar: "FOAM 6 kg", lokasi: "AREA SOLAR BARAT", noApar: "118B", expDate: "27/12/2025", hydrotestDate: "" }
  ],
  "area-tps-b3": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "TPS B3 RM", noApar: "119", expDate: "18/7/2028", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "TPS B3 WIRE", noApar: "119A", expDate: "7/6/2026", hydrotestDate: "" },
    { no: 3, jenisApar: "DRY CHEMICAL POWDER 6 kg", lokasi: "TPS DOMESTIC", noApar: "119B", expDate: "22/03/2027", hydrotestDate: "" }
  ],
  "new-building-warehouse": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU MASUK TIMUR WAREHOUSE", noApar: "120", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "RAK M2 WAREHOUSE", noApar: "121", expDate: "22/7/2028", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "RAK M1 WAREHOUSE", noApar: "122", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "PINTU MASUK BARAT WAREHOUSE", noApar: "123", expDate: "11/12/2029", hydrotestDate: "" }
  ],
  "genba-b": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "SISI BARAT CV 8A DKT PINTU", noApar: "124", expDate: "9/10/2027", hydrotestDate: "" },
    { no: 2, jenisApar: "FOAM 6 kg (ATP)", lokasi: "SISI BARAT CV 8A DKT PINTU", noApar: "125", expDate: "22/3/2027", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "CV 8A DEKAT PINTU DARURAT", noApar: "126", expDate: "9/10/2027", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "SAMPING TANGGA", noApar: "127", expDate: "7/5/2026", hydrotestDate: "" },
    { no: 5, jenisApar: "GAS CAIR 6 kg", lokasi: "SAMPING LIFT BARANG ATAS", noApar: "128", expDate: "22/7/2028", hydrotestDate: "" },
    { no: 6, jenisApar: "GAS CAIR 6 kg", lokasi: "STORE CV B1 SELATAN", noApar: "129", expDate: "5/8/2027", hydrotestDate: "" },
    { no: 7, jenisApar: "GAS CAIR 6 kg", lokasi: "STORE CV B1", noApar: "130", expDate: "14/3/2028", hydrotestDate: "" },
    { no: 8, jenisApar: "GAS CAIR 6 kg", lokasi: "STORE CV B1", noApar: "131", expDate: "7/1/2026", hydrotestDate: "" },
    { no: 9, jenisApar: "GAS CAIR 6 kg", lokasi: "STORE B1 UTARA", noApar: "132", expDate: "10/5/2030", hydrotestDate: "" },
    { no: 10, jenisApar: "GAS CAIR 6 kg", lokasi: "CV 5A, CV B1 (JENDELA SISI UTARA)", noApar: "133", expDate: "26/9/2027", hydrotestDate: "" },
    { no: 11, jenisApar: "GAS CAIR 6 kg", lokasi: "BAWAH MEZZANINE GENBA B", noApar: "133A", expDate: "20/12/2025", hydrotestDate: "" },
    { no: 12, jenisApar: "GAS CAIR 6 kg", lokasi: "SECOND FLOOR  GENBA B SISI UTARA TIMUR", noApar: "134", expDate: "7/1/2026", hydrotestDate: "" },
    { no: 13, jenisApar: "GAS CAIR 6 kg", lokasi: "SECOND FLOOR  GENBA B SISI UTARA BARAT", noApar: "134A", expDate: "14/3/2028", hydrotestDate: "" }
  ],
  "power-house-workshop": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "AIR TANK GENBA ROOM", noApar: "135", expDate: "10/5/2026", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "GENSET RROM GENBA B", noApar: "136", expDate: "14/10/2027", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "KAPASITOR ROOM GENBA B", noApar: "137", expDate: "7/5/2026", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "TRAFO ROOM B", noApar: "138", expDate: "14/10/2027", hydrotestDate: "" },
    { no: 5, jenisApar: "DRY CHEMICAL POWDER 6 kg", lokasi: "WORKSHOP SUPPLIER", noApar: "139", expDate: "9/5/2028", hydrotestDate: "" },
    { no: 6, jenisApar: "GAS CAIR 6 kg", lokasi: "WORKSHOP KARYAWAN", noApar: "140", expDate: "5/1/2026", hydrotestDate: "" },
    { no: 7, jenisApar: "GAS CAIR 6 kg", lokasi: "WORKSHOP KARYAWAN", noApar: "141", expDate: "7/1/2026", hydrotestDate: "" }
  ],
  "area-segitiga-ga": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "SEGITIGA", noApar: "142", expDate: "24/2/2028", hydrotestDate: "" }
  ],
  "area-parkir-motor": [
    { no: 1, jenisApar: "DRY CHEMICAL POWDER 6 kg", lokasi: "PARKIR BAWAH BARAT", noApar: "143", expDate: "7/3/2027", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 6 kg", lokasi: "PARKIR BAWAH TENGAH SELATAN", noApar: "143A", expDate: "26/9/2027", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 6 kg", lokasi: "PARKIR BAWAH TENGAH", noApar: "144", expDate: "22/7/2028", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 6 kg", lokasi: "PARKIR ATAS TENGAH SELATAN", noApar: "144A", expDate: "14/3/2028", hydrotestDate: "" },
    { no: 5, jenisApar: "FOAM 6 kg", lokasi: "PARKIR BAWAH TIMUR", noApar: "145", expDate: "27/12/2025", hydrotestDate: "" },
    { no: 6, jenisApar: "FOAM 6 kg", lokasi: "PARKIR ATAS BARAT", noApar: "146", expDate: "27/12/2025", hydrotestDate: "" },
    { no: 7, jenisApar: "GAS CAIR 6 kg", lokasi: "PARKIR ATAS TENGAH", noApar: "147", expDate: "7/1/2026", hydrotestDate: "" },
    { no: 8, jenisApar: "FOAM 6 kg", lokasi: "PARKIR ATAS TIMUR", noApar: "148", expDate: "9/1/2027", hydrotestDate: "" }
  ],
  "forklift": [
    { no: 1, jenisApar: "DRY CHEMICAL POWDER 1 kg", lokasi: "FORKLIFT WHS (BERDIRI MERAH 1)", noApar: "WHS F- 1", expDate: "9/5/2028", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 1 kg", lokasi: "FORKLIFT WHS (BERDIRI MERAH 2)", noApar: "WHS F- 2", expDate: "9/5/2028", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 1 kg", lokasi: "FORKLIFT WHS (BERDIRI MERAH 3)", noApar: "WHS F- 3", expDate: "24/3/2027", hydrotestDate: "" },
    { no: 4, jenisApar: "FOAM 1 KG", lokasi: "FORKLIFT WHS (DUDUK MERAH)", noApar: "WHS F- 4", expDate: "9/5/2028", hydrotestDate: "" },
    { no: 5, jenisApar: "DRY CHEMICAL POWDER 1 kg", lokasi: "FORKLIFT EXIM (TOYOTA MATIC MERAH)", noApar: "EXIM F- 1", expDate: "17/12/2026", hydrotestDate: "" },
    { no: 6, jenisApar: "DRY CHEMICAL POWDER 1 kg", lokasi: "FORKLIFT EXIM (JUNHENCRICH)", noApar: "EXIM F- 3", expDate: "9/5/2028", hydrotestDate: "" },
    { no: 7, jenisApar: "GAS CAIR 1 kg (EXPIRED DRY CHEMICAL POWDER 1 kg)", lokasi: "FORKLIFT EXIM (JUNHENCRICH)", noApar: "EXIM F- 2", expDate: "15/9/2027", hydrotestDate: "" }
  ],
  "samping-pagar-rak-helm": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "DEPAN GUDANG GAGS", noApar: "149", expDate: "30/6/2030", hydrotestDate: "" }
  ],
  "belakang-kantin": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "SAMPING KANTOR SEKRETARIAT PUK", noApar: "150", expDate: "5/1/2026", hydrotestDate: "" }
  ],
  "ir-room": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "DEPAN OFFICE IR", noApar: "151", expDate: "18/11/2026", hydrotestDate: "" }
  ],
  "area-auditorium-outdoor": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "AUDITORIUM OUTDOOR SISI BARAT", noApar: "152", expDate: "18/11/2026", hydrotestDate: "" }
  ],
  "area-klinik": [
    { no: 1, jenisApar: "GAS CAIR 6 kg", lokasi: "DEPAN  KLINIK", noApar: "153", expDate: "17/12/2026", hydrotestDate: "" }
  ],
  "mesin-raychem-genba-a": [
    { no: 1, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.TRC-05", noApar: "154", expDate: "24/11/2028", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.TRC-01", noApar: "", expDate: "", hydrotestDate: "" },
    { no: 2, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.TRC-02", noApar: "", expDate: "", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.TRC-03", noApar: "", expDate: "", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.TRC-04", noApar: "", expDate: "", hydrotestDate: "" },
    { no: 5, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.TRC-06", noApar: "", expDate: "", hydrotestDate: "" },
    { no: 7, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.TRC-08", noApar: "", expDate: "", hydrotestDate: "" },
    { no: 6, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.TRC-09", noApar: "", expDate: "", hydrotestDate: "" }
  ],
  "mesin-raychem-genba-b": [
    { no: 2, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.TRC-07", noApar: "155", expDate: "7/11/2028", hydrotestDate: "" },
    { no: 3, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.DFM-01", noApar: "156", expDate: "7/11/2028", hydrotestDate: "" },
    { no: 4, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.DFM-02", noApar: "157", expDate: "7/11/2028", hydrotestDate: "" }
  ],
  "mesin-raychem-genba-c": [
    { no: 5, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.NPR-01", noApar: "158", expDate: "24/11/2028", hydrotestDate: "" },
    { no: 6, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.NPR-03", noApar: "159", expDate: "24/11/2028", hydrotestDate: "" },
    { no: 7, jenisApar: "GAS CAIR 1 kg", lokasi: "RAYC.NPR-06", noApar: "160", expDate: "24/11/2028", hydrotestDate: "" }
  ]
};
