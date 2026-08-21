// app/e-checksheet-ins-apd/EChecksheetInsApdForm.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import {
  getItemsByType,
  getChecklistByDate,
  getAvailableDates,
  getAreaById,
  ChecklistItem
} from "@/lib/api/checksheet";

// ✅ TAMBAHKAN IMPORT OFFLINE & SCAN VERIFICATION
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { useScanVerification } from "@/lib/hooks/useScanVerification";
import { QrCode } from "lucide-react";

export function EChecksheetInsApdForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  
  // ✅ TAMBAHKAN HOOK CONNECTION & SCAN
  const { isOnline, pendingCount } = useConnection();
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  
  // ✅ Handle both 'areaId' and 'areald' (typo in URL)
  const areaIdParam = searchParams.get('areaId') || searchParams.get('areald');
  const areaNameParam = searchParams.get('areaName') || 'Area';
  const areaType = searchParams.get('areaType') || 'Type';
  
  const TYPE_SLUG = 'inspeksi-apd';
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [areaId, setAreaId] = useState<number | null>(null);
  const [areaNumber, setAreaNumber] = useState<number | null>(null); // ✅ Nomor area dari database
  const [allItems, setAllItems] = useState<ChecklistItem[]>([]);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingArea, setIsLoadingArea] = useState(false);

  // ✅ Load ALL items from API
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setAllItems(items);
        console.log('📋 Loaded', items.length, 'total items');
      } catch (error) {
        console.error("Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist.");
      }
    };
    loadItems();
  }, []);

  // ✅ Load area data untuk mendapatkan nomor area
  useEffect(() => {
    if (!areaIdParam) {
      console.warn('⚠️ areaIdParam is null or undefined');
      return;
    }

    const loadArea = async () => {
      try {
        setIsLoadingArea(true);
        const parsedAreaId = parseInt(areaIdParam);
        setAreaId(parsedAreaId);

        // ✅ Panggil API untuk mendapatkan data area termasuk nomor area
        const area = await getAreaById(TYPE_SLUG, parsedAreaId);
        
        if (area) {
          setAreaNumber(area.no);
          console.log('✅ Loaded area:', area.name, 'with number:', area.no);
        } else {
          console.error('❌ Area not found for ID:', parsedAreaId);
          alert('Area tidak ditemukan!');
        }
      } catch (error) {
        console.error("Failed to load area data:", error);
        alert("Gagal memuat data area.");
      } finally {
        setIsLoadingArea(false);
      }
    };

    loadArea();
  }, [areaIdParam]);

  // ✅ Filter items based on area NUMBER (bukan areaId)
  useEffect(() => {
    if (!areaNumber || allItems.length === 0) {
      console.log('⏳ Waiting for areaNumber or items...');
      return;
    }

    console.log('🔍 Filtering items for area number:', areaNumber);

    // ✅ Gunakan nomor area, bukan ID area
    // Contoh: AREA01_PROSES01 untuk Area nomor 1
    const expectedPrefix = `AREA${areaNumber.toString().padStart(2, '0')}_`;

    const filtered = allItems.filter(item => 
      item.item_key.startsWith(expectedPrefix)
    );

    console.log('✅ Filtered to', filtered.length, 'items for this area');

    if (filtered.length === 0) {
      console.warn('⚠️ No items found for area number:', areaNumber);
      setInspectionItems([]);
      setRows([]);
      return;
    }

    setInspectionItems(filtered);
    initializeRowsFromItems(filtered);
  }, [areaNumber, allItems]);

  // ✅ Initialize rows from inspection items
  const initializeRowsFromItems = (items: ChecklistItem[]) => {
    const newRows: any[] = [];
    
    // ✅ Get all PROSES items for this area
    const prosesItems = items.filter(item => item.item_group === 'PROSES');

    console.log('Found', prosesItems.length, 'PROSES items');

    prosesItems.forEach(prosesItem => {
      // ✅ Add proses row (header row - grey background)
      newRows.push({
        type: "proses",
        item_key: prosesItem.item_key,
        proses: prosesItem.item_check,
        r1: "",
        r2: "",
        r3: "",
        r4: "",
        r5: "",
        r6: "",
        persentaseOk: "",
        problem: "",
        tindakanPerbaikan: "",
        pic: "",
        verify: ""
      });
      
      // ✅ Find APD items for this proses (item_group = item_key dari proses)
      const apdItems = items.filter(item => item.item_group === prosesItem.item_key);
      
      console.log('  -', prosesItem.item_check, ':', apdItems.length, 'APD items');
      
      // ✅ Add APD rows
      apdItems.forEach(apdItem => {
        newRows.push({
          type: "apd",
          item_key: apdItem.item_key,
          proses: apdItem.item_check,
          r1: "",
          r2: "",
          r3: "",
          r4: "",
          r5: "",
          r6: "",
          persentaseOk: "",
          problem: "",
          tindakanPerbaikan: "",
          pic: "",
          verify: ""
        });
      });
    });

    console.log('✅ Initialized', newRows.length, 'rows');
    setRows(newRows);
  };

  // ✅ Load available dates
  useEffect(() => {
    if (!areaIdParam || !isMounted || !authVerified) return;
    
    const loadAreaData = async () => {
      try {
        const parsedAreaId = parseInt(areaIdParam);
        
        const dates = await getAvailableDates(TYPE_SLUG, parsedAreaId);
        setAvailableDates(dates);
      } catch (error) {
        console.error("Failed to load area data:", error);
        alert("Gagal memuat data area.");
      }
    };

    loadAreaData();
  }, [areaIdParam, isMounted, authVerified]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Authentication verification
  useEffect(() => {
    if (!isMounted || !isInitialized || authLoading) {
      setAuthVerified(false);
      return;
    }
    if (user && isAuthorizedForChecksheet(user)) {
      setAuthVerified(true);
      return;
    }

    const verificationTimeout = setTimeout(() => {
      if (!user || !isAuthorizedForChecksheet(user)) {
        router.push("/login-page");
      } else {
        setAuthVerified(true);
      }
    }, 1500);

    return () => clearTimeout(verificationTimeout);
  }, [user, authLoading, isInitialized, router, isMounted]);

  // ✅ Load existing data
  const handleLoadExisting = async () => {
    if (!selectedDate) {
      alert("Please select a date first");
      return;
    }
    if (!areaId) {
      alert("Area tidak valid!");
      return;
    }
    try {
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      
      if (data && Object.keys(data).length > 0) {
        const newRows = rows.map(row => {
          const itemData = data[row.item_key];
          if (itemData) {
            let parsedNotes: any = {};
            try {
              if (itemData.notes) {
                parsedNotes = JSON.parse(itemData.notes);
              }
            } catch (e) {
              console.error('Error parsing notes:', e);
            }
            
            return {
              ...row,
              r1: parsedNotes.r1 || "",
              r2: parsedNotes.r2 || "",
              r3: parsedNotes.r3 || "",
              r4: parsedNotes.r4 || "",
              r5: parsedNotes.r5 || "",
              r6: parsedNotes.r6 || "",
              persentaseOk: itemData.hasilPemeriksaan || "",
              problem: itemData.keteranganTemuan || "",
              tindakanPerbaikan: itemData.tindakanPerbaikan || "",
              pic: itemData.pic || "",
              verify: itemData.verify || ""
            };
          }
          return row;
        });
        
        setRows(newRows);
        alert("Data loaded successfully");
      } else {
        alert("No data found for this date");
        initializeRowsFromItems(inspectionItems);
      }
    } catch (error) {
      console.error("Error loading existing data:", error);
      alert("Failed to load data");
    }
  };

  // ✅ MODIFIKASI handleSave MENGGUNAKAN SMARTFETCH
  const handleSave = async () => {
    if (!user) {
      alert("User belum login");
      router.push("/login-page");
      return;
    }
    if (!selectedDate) {
      alert("Please select an inspection date");
      return;
    }
    if (!areaId) {
      alert("Area tidak valid!");
      return;
    }
    if (rows.length === 0) {
      alert("Tidak ada data untuk disimpan!");
      return;
    }

    // Calculate percentage for APD items
    const updatedRows = rows.map(row => {
      if (row.type === "proses") {
        return { ...row, persentaseOk: "" };
      }
      const responses = [row.r1, row.r2, row.r3, row.r4, row.r5, row.r6];
      const okCount = responses.filter(r => r === "✓").length;
      const percentage = ((okCount / 6) * 100).toFixed(0) + "%";
      return { ...row, persentaseOk: percentage };
    });

    try {
      setIsSaving(true);

      const checklistData: any = {};
      
      updatedRows.forEach((row) => {
        const notesData = {
          r1: row.r1 || "",
          r2: row.r2 || "",
          r3: row.r3 || "",
          r4: row.r4 || "",
          r5: row.r5 || "",
          r6: row.r6 || ""
        };
        
        checklistData[row.item_key] = {
          date: selectedDate,
          hasilPemeriksaan: row.persentaseOk || "",
          keteranganTemuan: row.problem || "",
          tindakanPerbaikan: row.tindakanPerbaikan || "",
          pic: row.pic || "",
          dueDate: "",
          verify: row.verify || "",
          inspector: user.fullName || "",
          images: [],
          notes: JSON.stringify(notesData)
        };
      });

      const submitData = {
        type: TYPE_SLUG,
        areaId: areaId,
        date: selectedDate,
        data: checklistData,
        userId: user.id || "unknown",
        userName: user.fullName || "Unknown Inspector",
        // Data tambahan dari URL params untuk metadata
        areaName: areaNameParam,
        areaType: areaType
      };

      // ✅ GUNAKAN SMARTFETCH UNTUK OFFLINE MODE
      const response = await smartFetch('/api/checksheet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
        queueType: 'inspeksi_apd',
        metadata: { 
          areaCode: `apd-${areaIdParam}`,
         
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Inspection data saved for ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
        
        setTimeout(() => {
          router.push(`/status-ga/inspeksi-apd?openArea=${encodeURIComponent(areaNameParam)}`);
        }, 500);
      } else {
        throw new Error(result.message || 'Gagal menyimpan data');
      }
      
    } catch (error) {
      console.error("Error saving checklist data:", error);
      alert("Failed to save data: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateRowField = (index: number, field: string, value: string) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  // Loading screen
  if (!isMounted || !isInitialized || !authVerified) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666" }}>
            {authLoading ? "Loading authentication..." : "Verifying session..."}
          </p>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <Sidebar userName={user?.fullName} />
      <div style={{
        paddingLeft: "95px",
        paddingRight: "25px",
        paddingTop: "32px",
        paddingBottom: "32px",
        maxWidth: "100%",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{
              margin: "0 0 6px 0",
              color: "white",
              fontSize: "26px",
              fontWeight: "600",
              letterSpacing: "-0.5px"
            }}>
              APD Inspection Form
            </h1>
            <p style={{
              margin: 0,
              color: "#e3f2fd",
              fontSize: "14px"
            }}>
              Monthly APD compliance checklist for {areaNameParam} ({areaType})
            </p>
          </div>
        </div>

        {/* ✅ SCAN & ADMIN VIEW BANNER */}
        {user && ["admin", "superadmin"].includes(user.role) ? (
          <div style={{ padding: "12px 16px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#3730a3", fontSize: "14px", fontWeight: "600" }}>
            <span>👁️ Mode View Admin (Read-Only) — Anda dapat melihat data checksheet tanpa perlu scan QR. Mode simpan di-nonaktifkan.</span>
          </div>
        ) : !isScanned ? (
          <div className="banner banner-warning scan-warning">
            <span>🔒 Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.</span>
            <button 
              onClick={() => router.push("/scan")} 
              className="banner-btn"
              disabled={isSaving}
            >
              <QrCode size={14} /> Scan Sekarang
            </button>
          </div>
        ) : null}

        {/* Info Area */}
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginTop: "20px",
          marginBottom: "24px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Area ID</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{areaIdParam}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Area Name</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{areaNameParam}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Area Type</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{areaType}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Inspector</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{user?.fullName}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Total Items</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#1976d2" }}>
                {isLoadingArea ? "Loading..." : 
                 `${rows.length} rows (${rows.filter(r => r.type === 'apd').length} APD items)`}
              </span>
            </div>
          </div>
        </div>

        {/* Inspection Schedule */}
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontWeight: "500", color: "#212121", fontSize: "15px" }}>Inspection Schedule</span>
            <span style={{ fontSize: "13px", color: "#757575", marginLeft: "8px" }}>○ Every month</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>Tanggal Inspeksi:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              disabled={!isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              style={{
                color: "#212121",
                padding: "7px 12px",
                border: "1px solid #d0d0d0",
                borderRadius: "5px",
                fontSize: "14px",
                outline: "none",
                minWidth: "160px",
                background: isScanned ? "white" : "#f5f5f5",
                cursor: isScanned ? "text" : "not-allowed"
              }}
            />
          </div>

          {availableDates.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>Riwayat Isian:</label>
              <select
                value=""
                onChange={(e) => {
                  const date = e.target.value;
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                disabled={!isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  color: "#212121",
                  padding: "7px 12px",
                  border: "1px solid #d0d0d0",
                  borderRadius: "5px",
                  fontSize: "14px",
                  outline: "none",
                  minWidth: "180px",
                  background: isScanned ? "white" : "#f5f5f5",
                  cursor: isScanned ? "pointer" : "not-allowed"
                }}
              >
                <option value="">— Pilih tanggal lama —</option>
                {availableDates
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleLoadExisting}
                disabled={!selectedDate || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  padding: "7px 16px",
                  background: (selectedDate && isScanned) ? "#ff9800" : "#e0e0e0",
                  color: (selectedDate && isScanned) ? "white" : "#9e9e9e",
                  border: "none",
                  borderRadius: "5px",
                  cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed",
                  fontWeight: "500",
                  fontSize: "14px"
                }}
              >
                Load Existing
              </button>
            </div>
          )}
        </div>

        {/* Tabel APD */}
        {isLoadingArea ? (
          <div style={{
            background: "white",
            borderRadius: "8px",
            padding: "60px 20px",
            textAlign: "center",
            border: "1px solid #e0e0e0"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>⏳</div>
            <p style={{ fontSize: "15px", fontWeight: "500", color: "#9e9e9e", margin: 0 }}>
              Loading area data...
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{
            background: "white",
            borderRadius: "8px",
            padding: "60px 20px",
            textAlign: "center",
            border: "1px solid #e0e0e0"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📋</div>
            <p style={{ fontSize: "15px", fontWeight: "500", color: "#9e9e9e", margin: 0 }}>
              {inspectionItems.length === 0 
                ? 'No inspection items found for this area' 
                : 'Loading inspection items...'}
            </p>
          </div>
        ) : (
          <div style={{
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            overflow: "hidden",
            border: "1px solid #e0e0e0",
            marginBottom: "24px"
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1600px" }}>
                <thead>
                  <tr style={{ background: "#fafafa", borderBottom: "2px solid #ccc" }}>
                    <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "4%" }}>NO</th>
                    <th style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "12%" }}>PROSES</th>
                    <th rowSpan={2} colSpan={6} style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "30%" }}>NO. MESIN/NIK</th>
                    <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "8%" }}>PROSENTASE OK</th>
                    <th rowSpan={2} colSpan={4} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "16%" }}>PROBLEM</th>
                    <th rowSpan={2} colSpan={4} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "16%" }}>TINDAKAN PERBAIKAN</th>
                    <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "8%" }}>PIC</th>
                    <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "8%" }}>VERIFY</th>
                  </tr>
                  <tr style={{ background: "#fafafa", borderBottom: "2px solid #ccc" }}>
                    <th style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "18%" }}>STANDART APD</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ 
                        padding: "8px", 
                        border: "1px solid #ddd", 
                        textAlign: "center", 
                        fontWeight: "600",
                        background: row.type === "proses" ? "#f5f5f5" : "white"
                      }}>
                        {idx + 1}
                      </td>
                      <td style={{ 
                        padding: "8px", 
                        border: "1px solid #ddd", 
                        textAlign: "left", 
                        fontWeight: row.type === "proses" ? "600" : "normal",
                        background: row.type === "proses" ? "#f5f5f5" : "white"
                      }}>
                        <input
                          value={row.proses}
                          disabled
                          style={{
                            width: "100%",
                            padding: "4px",
                            fontSize: "12px",
                            border: "none",
                            background: "transparent",
                            outline: "none",
                            fontWeight: row.type === "proses" ? "600" : "normal"
                          }}
                        />
                      </td>
                      {[...Array(6)].map((_, i) => {
                        const field = `r${i + 1}` as keyof typeof row;
                        return (
                          <td key={i} style={{ 
                            padding: "6px", 
                            border: "1px solid #ddd", 
                            textAlign: "center",
                            background: "white"
                          }}>
                            {row.type === "proses" ? (
                              <input
                                value={row[field]}
                                onChange={(e) => updateRowField(idx, String(field), e.target.value)}
                                disabled={!selectedDate || !isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                placeholder="NIK/Mesin"
                                style={{
                                  width: "100%",
                                  padding: "4px",
                                  fontSize: "12px",
                                  border: "1px solid #ccc",
                                  borderRadius: "3px",
                                  background: (selectedDate && isScanned) ? "#f9f9f9" : "#f5f5f5",
                                  cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                                }}
                              />
                            ) : (
                              <select
                                value={row[field]}
                                onChange={(e) => updateRowField(idx, String(field), e.target.value)}
                                disabled={!selectedDate || !isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                style={{
                                  width: "100%",
                                  padding: "4px",
                                  fontSize: "12px",
                                  border: "1px solid #ccc",
                                  borderRadius: "3px",
                                  background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                                  cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed"
                                }}
                              >
                                <option value="">-</option>
                                <option value="✓">✓</option>
                                <option value="✗">✗</option>
                              </select>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ 
                        padding: "8px", 
                        border: "1px solid #ddd", 
                        textAlign: "center",
                        background: "white"
                      }}>
                        {row.persentaseOk}
                      </td>
                      <td colSpan={4} style={{ 
                        padding: "6px", 
                        border: "1px solid #ddd",
                        background: "white"
                      }}>
                        <textarea
                          value={row.problem}
                          onChange={(e) => updateRowField(idx, "problem", e.target.value)}
                          disabled={!selectedDate || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          placeholder="Alasan tidak memakai APD..."
                          rows={1}
                          style={{
                            width: "100%",
                            padding: "4px",
                            fontSize: "12px",
                            resize: "vertical",
                            border: "1px solid #ccc",
                            borderRadius: "3px",
                            background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                            cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                          }}
                        />
                      </td>
                      <td colSpan={4} style={{ 
                        padding: "6px", 
                        border: "1px solid #ddd",
                        background: "white"
                      }}>
                        <textarea
                          value={row.tindakanPerbaikan}
                          onChange={(e) => updateRowField(idx, "tindakanPerbaikan", e.target.value)}
                          disabled={!selectedDate || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          placeholder="Tindakan perbaikan..."
                          rows={1}
                          style={{
                            width: "100%",
                            padding: "4px",
                            fontSize: "12px",
                            resize: "vertical",
                            border: "1px solid #ccc",
                            borderRadius: "3px",
                            background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                            cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                          }}
                        />
                      </td>
                      <td style={{ 
                        padding: "6px", 
                        border: "1px solid #ddd",
                        background: "white"
                      }}>
                        <input
                          type="text"
                          value={row.pic}
                          onChange={(e) => updateRowField(idx, "pic", e.target.value)}
                          disabled={!selectedDate || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          placeholder="PIC"
                          style={{
                            width: "100%",
                            padding: "4px",
                            fontSize: "12px",
                            border: "1px solid #ccc",
                            borderRadius: "3px",
                            background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                            cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                          }}
                        />
                      </td>
                      <td style={{ 
                        padding: "6px", 
                        border: "1px solid #ddd",
                        background: "white"
                      }}>
                        <input
                          type="text"
                          value={row.verify}
                          onChange={(e) => updateRowField(idx, "verify", e.target.value)}
                          disabled={!selectedDate || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          placeholder="Verify"
                          style={{
                            width: "100%",
                            padding: "4px",
                            fontSize: "12px",
                            border: "1px solid #ccc",
                            borderRadius: "3px",
                            background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                            cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/inspeksi-apd")}
            style={{
              padding: "11px 28px",
              background: "#757575",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "500",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            ← Kembali
          </button>
          {!(user && ["admin", "superadmin"].includes(user.role)) ? (
            <button
              onClick={handleSave}
              disabled={!selectedDate || isSaving || rows.length === 0 || !isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              style={{
                padding: "11px 28px",
                background: (selectedDate && !isSaving && rows.length > 0 && isScanned) ? "#1976d2" : "#e0e0e0",
                color: (selectedDate && !isSaving && rows.length > 0 && isScanned) ? "white" : "#9e9e9e",
                border: "none",
                borderRadius: "6px",
                fontWeight: "500",
                fontSize: "15px",
                opacity: (selectedDate && !isSaving && rows.length > 0 && isScanned) ? 1 : 0.6,
                cursor: (selectedDate && !isSaving && rows.length > 0 && isScanned) ? "pointer" : "not-allowed"
              }}
            >
              {isSaving ? "Menyimpan..." : "✓ Simpan Data"}
            </button>
          ) : (
            <div style={{ padding: "11px 24px", background: "#f1f5f9", color: "#64748b", borderRadius: "6px", fontWeight: "600", fontSize: "14px", border: "1px solid #cbd5e1" }}>
              🔒 Mode View Admin (Simpan Di-nonaktifkan)
            </div>
          )}
        </div>

        {/* ✅ CSS UNTUK BANNER */}
        <style jsx>{`
          .banner {
            border-radius: 10px;
            padding: 12px 18px;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
          }
          .banner-warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            color: #92400e;
            box-shadow: 0 2px 8px rgba(245,158,11,0.12);
          }
          .banner-btn {
            margin-left: auto;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            border: none;
            border-radius: 7px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.2s;
            box-shadow: 0 2px 6px rgba(245,158,11,0.3);
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 36px;
          }
          .banner-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(245,158,11,0.4);
          }
          .banner-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          .scan-warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-left: 4px solid #f59e0b;
            justify-content: space-between;
          }
          .scan-warning .banner-btn {
            background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
            padding: 8px 16px;
          }
          .scan-warning .banner-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(124, 58, 237, 0.4);
          }

          @media (max-width: 1200px) {
            div[style*="paddingLeft"] {
              padding-left: 80px !important;
            }
          }

          @media (max-width: 768px) {
            div[style*="paddingLeft"] {
              padding-left: 25px !important;
              padding-right: 15px !important;
              padding-top: 20px !important;
              padding-bottom: 20px !important;
            }

            div[style*="gridTemplateColumns"] {
              grid-template-columns: 1fr !important;
              gap: 8px !important;
            }

            h1 {
              font-size: 20px !important;
              margin-bottom: 6px !important;
            }

            p {
              font-size: 12px !important;
            }

            table {
              font-size: 12px !important;
              min-width: 600px;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }

            table th,
            table td {
              padding: 8px 6px !important;
              border: 1px solid #ddd !important;
            }

            input[type="date"],
            input[type="text"],
            input[type="email"],
            select,
            textarea {
              font-size: 14px !important;
              min-height: 36px !important;
              width: 100% !important;
              padding: 8px 8px !important;
            }

            button {
              font-size: 13px !important;
              min-height: 36px !important;
              padding: 8px 12px !important;
            }

            div[style*="display: flex"] {
              flex-direction: column !important;
              gap: 10px !important;
            }
          }

          @media (max-width: 480px) {
            div[style*="paddingLeft"] {
              padding-left: 15px !important;
              padding-right: 12px !important;
              padding-top: 16px !important;
              padding-bottom: 16px !important;
            }

            h1 {
              font-size: 18px !important;
              margin-bottom: 4px !important;
            }

            p {
              font-size: 11px !important;
            }

            table {
              font-size: 10px !important;
              min-width: 500px;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }

            table th,
            table td {
              padding: 6px 4px !important;
              border: 1px solid #ddd !important;
            }

            input[type="date"],
            input[type="text"],
            input[type="email"],
            select,
            textarea {
              font-size: 14px !important;
              min-height: 34px !important;
              width: 100% !important;
              padding: 6px 6px !important;
            }

            button {
              font-size: 12px !important;
              min-height: 40px !important;
              padding: 8px 10px !important;
              width: 100% !important;
            }

            div[style*="display: flex"] {
              flex-direction: column !important;
              gap: 8px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}