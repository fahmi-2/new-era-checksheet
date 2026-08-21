// app/status-ga/panel/GaPanelContent.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";
// ✅ Import API helper yang reusable
import {
  getAreasByType,
  getAvailableDates,
  getChecklistByDate,
  getItemsByType,
  ChecklistItem
} from "@/lib/api/checksheet";

interface Area {
  id: number;
  no: number;
  name: string;
  location: string;
}

export function GaPanelContent() {
  const router = useRouter();
  const { user, loading: authLoading, isInitialized } = useAuth();

  // ✅ FIX: Use native URL API instead of useSearchParams hook to avoid conflicts
  const getQueryParam = (name: string): string => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(name) || '';
  };

  // ✅ Gunakan helper untuk membaca parameter
  const openPanelParam = getQueryParam('openPanel');
  const TYPE_SLUG = 'panel';
  
  // ✅ CRITICAL FIX: State untuk tracking auth verification
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [checksheetData, setChecksheetData] = useState<any>(null);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [areaStatuses, setAreaStatuses] = useState<Record<number, { statusLabel: string; statusColor: string; lastCheck: string }>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  
  // ✅ Modal gambar
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [currentPreviewImage, setCurrentPreviewImage] = useState("");

  // ✅ Load inspection items dari API
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setInspectionItems(items);
      } catch (error) {
        console.error("Failed to load checklist items:", error);
      }
    };
    loadItems();
  }, []);

  // ✅ Load areas dari API berdasarkan type
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const data = await getAreasByType(TYPE_SLUG);
        setAreas(data);
      } catch (error) {
        console.error("Failed to load areas:", error);
      }
    };
    loadAreas();
  }, []);

  // ✅ Load status untuk semua area
  useEffect(() => {
    if (areas.length === 0 || isLoadingStatuses || !authVerified) return;
    
    const loadAllStatuses = async () => {
      setIsLoadingStatuses(true);
      
      const statusMap: Record<number, { statusLabel: string; statusColor: string; lastCheck: string }> = {};

      for (const area of areas) {
        try {
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          
          if (dates.length > 0) {
            const latest = dates[0];
            statusMap[area.id] = {
              statusLabel: "Checked",
              statusColor: "#43a047",
              lastCheck: new Date(latest).toLocaleDateString("id-ID", { 
                day: "numeric", 
                month: "short" 
              })
            };
          } else {
            statusMap[area.id] = {
              statusLabel: "No Data",
              statusColor: "#757575",
              lastCheck: "-"
            };
          }
        } catch (error) {
          console.error(`Error loading status for area ${area.id}:`, error);
          statusMap[area.id] = {
            statusLabel: "Error",
            statusColor: "#f44336",
            lastCheck: "-"
          };
        }
      }

      setAreaStatuses(statusMap);
      setIsLoadingStatuses(false);
    };

    loadAllStatuses();
  }, [areas, authVerified]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ CRITICAL FIX: Authentication verification dengan state tracking dan delay
  useEffect(() => {
    if (!isMounted || !isInitialized || authLoading) {
      console.log('⏳ Auth still loading or component not mounted');
      setAuthVerified(false);
      return;
    }

    if (user && isAuthorizedForChecksheet(user)) {
      console.log('✅ Auth verified successfully');
      setAuthVerified(true);
      return;
    }

    // Beri waktu 1.5 detik sebelum redirect
    const verificationTimeout = setTimeout(() => {
      if (!user || !isAuthorizedForChecksheet(user)) {
        console.error('❌ Auth verification failed after delay:', { user, authLoading });
        router.push("/login-page");
      } else {
        setAuthVerified(true);
      }
    }, 1500);

    return () => clearTimeout(verificationTimeout);
  }, [user, authLoading, isInitialized, router, isMounted]);

  // ✅ Auto-open modal jika ada openPanel param - HANYA SETELAH AUTH VERIFIED
  useEffect(() => {
    if (!isMounted || !authVerified || !openPanelParam || areas.length === 0) return;
    console.log('🔍 Searching for area to auto-open:', openPanelParam);
    
    const found = areas.find((item) => {
      const parts = item.name.split(' \u0007 ');
      return parts[0] === openPanelParam;
    });

    if (found) {
      console.log('✅ Found area, opening detail:', found.name);
      setTimeout(() => openDetail(found), 300);
    }
  }, [isMounted, authVerified, openPanelParam, areas]);

  // ✅ Open detail dengan load data dari API - FIX UTAMA
  const openDetail = async (area: Area) => {
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);
    try {
      // Load available dates
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      setAvailableDates(dates);
      
      if (dates.length > 0) {
        const latestDate = dates[0];
        setSelectedDate(latestDate);

        // Load checklist data untuk tanggal terbaru - TANPA TRANSFORMASI SALAH
        const data = await getChecklistByDate(TYPE_SLUG, area.id, latestDate);
        console.log('✅ Raw data from API:', data);
        setChecksheetData(data); // LANGSUNG SET DATA DARI API
      } else {
        setChecksheetData(null);
        setSelectedDate("");
      }
    } catch (error) {
      console.error("Error loading detail:", error);
      setChecksheetData(null);
      setAvailableDates([]);
      setSelectedDate("");
      alert("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedArea(null);
    setChecksheetData(null);
    setAvailableDates([]);
    setSelectedDate("");
    setShowModal(false);
  };

  // ✅ Load data ketika tanggal berubah - FIX UTAMA
  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (selectedArea && newDate) {
      setIsLoading(true);
      try {
        // Load data langsung dari API tanpa transformasi
        const data = await getChecklistByDate(TYPE_SLUG, selectedArea.id, newDate);
        console.log('✅ Data for selected date:', data);
        setChecksheetData(data);
      } catch (error) {
        console.error("Error loading checklist:", error);
        setChecksheetData(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ✅ Fungsi buka modal gambar
  const openImageModal = (url: string) => {
    setCurrentImageUrl(url);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImageUrl("");
  };

  // ✅ Fungsi untuk membuka modal preview gambar
  const openImagePreviewModal = (imageUrl: string) => {
    setCurrentPreviewImage(imageUrl);
    setShowImagePreviewModal(true);
  };

  const closeImagePreviewModal = () => {
    setShowImagePreviewModal(false);
    setCurrentPreviewImage("");
  };

  // ✅ CRITICAL FIX: Tampilkan loading screen selama auth belum verified
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
          <p style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  // ✅ Hanya render UI jika auth sudah verified
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user?.fullName} />
      <div style={{
        paddingLeft: "96px",
        paddingRight: "20px",
        paddingTop: "24px",
        paddingBottom: "24px",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }} className="header">
          <button
            onClick={() => router.push("/status-ga")}
            className="btn-back"
            aria-label="Kembali ke halaman utama"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
          
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
              📋 GA Panel Inspection Dashboard
            </h1>
            <p style={{ 
              margin: 0, 
              color: "#e3f2fd", 
              fontSize: "14px", 
              fontWeight: "400" 
            }}>
              Manajemen Data Inspeksi Kelayakan Panel Listrik
            </p>
          </div>
        </div>

        {/* Loading Status Indicator */}
        {isLoadingStatuses && (
          <div style={{ 
            padding: "12px 20px", 
            background: "#fff3cd", 
            borderRadius: "6px",
            marginBottom: "16px",
            color: "#856404",
            fontSize: "13px",
            textAlign: "center"
          }}>
            ⏳ Loading status data...
          </div>
        )}

        {/* Table */}
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
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Nama Panel</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Area</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area, idx) => {
                  const parts = area.name.split(' \u0007 ');
                  const panelName = parts[0] || '';
                  const areaName = parts[1] || '';
                  
                  const status = areaStatuses[area.id] || {
                    statusLabel: "Loading...",
                    statusColor: "#757575",
                    lastCheck: "-"
                  };

                  return (
                    <tr key={area.id} style={{ borderBottom: idx === areas.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{panelName}</td>
                      <td style={{ padding: "14px 16px", color: "#666", fontSize: "13px" }}>{areaName}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <span style={{
                            padding: "4px 12px",
                            background: status.statusColor,
                            color: "white",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            display: "inline-block"
                          }}>
                            {status.statusLabel}
                          </span>
                          <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{status.lastCheck}</span>
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
                            href={`/e-checksheet-ga/e-checksheet-panel?panelName=${encodeURIComponent(panelName)}&area=${encodeURIComponent(areaName)}`}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail dengan kolom DOKUMENTASI - FIX UTAMA */}
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
                  <h2 style={{ 
                    margin: "0 0 4px 0", 
                    color: "#212121", 
                    fontSize: "20px", 
                    fontWeight: "600" 
                  }}>
                    Inspection History - {selectedArea.name.split(' \u0007 ')[0]}
                  </h2>
                  <p style={{ 
                    margin: "0", 
                    color: "#616161", 
                    fontSize: "14px" 
                  }}>
                    {selectedArea.name.split(' \u0007 ')[1]}
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

              <div style={{ 
                padding: "16px 24px", 
                background: "white", 
                borderBottom: "1px solid #e0e0e0" 
              }}>
                <label style={{ 
                  fontWeight: "500", 
                  color: "#424242", 
                  marginRight: "12px", 
                  fontSize: "14px" 
                }}>
                  Inspection Date:
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  disabled={availableDates.length === 0}
                  style={{
                    color: "#212121",
                    padding: "7px 12px",
                    border: "1px solid #d0d0d0",
                    borderRadius: "5px",
                    fontSize: "14px",
                    fontWeight: "500",
                    minWidth: "160px",
                    outline: "none",
                    cursor: availableDates.length > 0 ? "pointer" : "not-allowed"
                  }}
                >
                  {availableDates.length === 0 ? (
                    <option value="">No data available</option>
                  ) : (
                    <>
                      <option value="">-- Select Date --</option>
                      {availableDates.map(date => (
                        <option key={date} value={date}>
                          {new Date(date).toLocaleDateString("id-ID", { 
                            day: "2-digit", 
                            month: "short", 
                            year: "numeric" 
                          })}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div style={{ 
                padding: "24px", 
                overflowY: "auto", 
                flex: 1, 
                background: "#fafafa" 
              }}>
                {!selectedDate ? (
                  <div style={{ 
                    textAlign: "center", 
                    padding: "60px 20px", 
                    color: "#757575" 
                  }}>
                    <div style={{ 
                      fontSize: "48px", 
                      marginBottom: "12px", 
                      opacity: 0.5 
                    }}>
                      📅
                    </div>
                    <p style={{ 
                      fontSize: "15px", 
                      fontWeight: "500", 
                      margin: 0 
                    }}>
                      {availableDates.length === 0 
                        ? "📭 No inspection data available for this panel" 
                        : "👆 Please select an inspection date"}
                    </p>
                  </div>
                ) : isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                    ⏳ Loading data...
                  </div>
                ) : !checksheetData ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
                    ❌ No data found for this date
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ 
                      width: "100%", 
                      borderCollapse: "collapse", 
                      fontSize: "12px", 
                      minWidth: "1200px", 
                      border: "1px solid #e0e0e0", 
                      background: "white" 
                    }}>
                      <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                          <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "50px" }}>No</th>
                          <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", minWidth: "200px" }}>ITEM</th>
                          <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "100px" }}>HASIL</th>
                          <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "180px" }}>KETERANGAN</th>
                          <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "200px" }}>DOKUMENTASI</th>
                          <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                          <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "80px" }}>PIC</th>
                          <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "100px" }}>DUE DATE</th>
                          <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "80px" }}>VERIFY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectionItems.map((item, index) => {
                          // ✅ AMBIL DATA LANGSUNG DARI API TANPA TRANSFORMASI
                          const entry = checksheetData[item.item_key];
                          const value = entry?.hasilPemeriksaan || "-";
                          const images = entry?.images || [];
                          
                          // ✅ TENTUKAN WARNA BERDASARKAN NILAI "O" ATAU "X" (BUKAN "OK"/"NG")
                          let bgColor = "#fff";
                          let textColor = "#999";
                          let displayValue = value;
                          
                          // Untuk item dropdown (bukan suhu/sambungan)
                          const isDropdownItem = ![
                            'temp_c', 
                            'temp_cable_connect', 
                            'temp_cable',
                            'sambungan_r',
                            'sambungan_s',
                            'sambungan_t'
                          ].includes(item.item_key);
                          
                          if (isDropdownItem) {
                            if (value === "O") {
                              bgColor = "#c8e6c9"; // Hijau muda
                              textColor = "#2e7d32"; // Hijau tua
                              displayValue = "✓ O";
                            } else if (value === "X") {
                              bgColor = "#ffcdd2"; // Merah muda
                              textColor = "#c62828"; // Merah tua
                              displayValue = "✗ X";
                            } else {
                              bgColor = "#f5f5f5"; // Abu-abu
                              textColor = "#999";
                              displayValue = "-";
                            }
                          } else {
                            // Untuk item suhu/sambungan, tampilkan nilai asli
                            displayValue = value === "-" ? "-" : `${value}°C`;
                            bgColor = "#f9f9f9";
                            textColor = "#333";
                          }

                          return (
                            <tr key={item.id || index}>
                              <td style={{ 
                                padding: "8px", 
                                border: "1px solid #e0e0e0", 
                                textAlign: "center", 
                                fontWeight: "600",
                                background: "white"
                              }}>{item.no}</td>
                              <td style={{ 
                                padding: "8px", 
                                border: "1px solid #e0e0e0", 
                                lineHeight: "1.4",
                                background: "white"
                              }}>{item.item_check}</td>
                              <td style={{
                                padding: "8px",
                                border: "1px solid #e0e0e0",
                                textAlign: "center",
                                fontWeight: "700",
                                background: bgColor,
                                color: textColor,
                                fontSize: "11px"
                              }}>
                                {displayValue}
                              </td>
                              <td style={{ 
                                padding: "8px", 
                                border: "1px solid #e0e0e0", 
                                lineHeight: "1.4", 
                                fontSize: "11px",
                                background: "white"
                              }}>
                                {entry?.keteranganTemuan || "-"}
                              </td>
                              <td style={{ 
                                padding: "8px", 
                                border: "1px solid #e0e0e0", 
                                verticalAlign: "top",
                                background: "white"
                              }}>
                                {images.length > 0 ? (
                                  <div style={{ 
                                    display: "flex", 
                                    flexWrap: "wrap", 
                                    gap: "6px",
                                    justifyContent: "center",
                                    maxHeight: "100px",
                                    overflowY: "auto"
                                  }}>
                                    {images.map((imgUrl: string, imgIdx: number) => (
                                      <div 
                                        key={imgIdx} 
                                        style={{ 
                                          position: "relative",
                                          width: "60px", 
                                          height: "60px", 
                                          overflow: "hidden", 
                                          borderRadius: "4px", 
                                          border: "1px solid #ddd",
                                          cursor: "pointer"
                                        }}
                                        onClick={() => openImagePreviewModal(imgUrl)}
                                      >
                                        <img
                                          src={imgUrl}
                                          alt={`Dok ${index + 1}-${imgIdx + 1}`}
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover"
                                          }}
                                        />
                                        <div style={{
                                          position: "absolute",
                                          top: "2px",
                                          right: "2px",
                                          background: "rgba(0,0,0,0.6)",
                                          color: "white",
                                          borderRadius: "50%",
                                          width: "18px",
                                          height: "18px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: "10px"
                                        }}>
                                          {imgIdx + 1}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div style={{ 
                                    textAlign: "center", 
                                    color: "#9e9e9e", 
                                    fontSize: "11px",
                                    padding: "8px 0"
                                  }}>
                                    -
                                  </div>
                                )}
                              </td>
                              <td style={{ 
                                padding: "8px", 
                                border: "1px solid #e0e0e0", 
                                lineHeight: "1.4", 
                                fontSize: "11px",
                                background: "white"
                              }}>
                                {entry?.tindakanPerbaikan || "-"}
                              </td>
                              <td style={{ 
                                padding: "8px", 
                                border: "1px solid #e0e0e0", 
                                textAlign: "center", 
                                fontSize: "11px",
                                background: "white"
                              }}>
                                {entry?.pic || "-"}
                              </td>
                              <td style={{ 
                                padding: "8px", 
                                border: "1px solid #e0e0e0", 
                                textAlign: "center", 
                                fontSize: "11px",
                                background: "white"
                              }}>
                                {entry?.dueDate ? new Date(entry.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "-"}
                              </td>
                              <td style={{ 
                                padding: "8px", 
                                border: "1px solid #e0e0e0", 
                                textAlign: "center", 
                                fontSize: "11px",
                                background: "white"
                              }}>
                                {entry?.verify || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* ✅ Modal Preview Gambar Besar */}
                    {showImagePreviewModal && (
                      <div
                        onClick={closeImagePreviewModal}
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "rgba(0,0,0,0.9)",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          zIndex: 3000,
                          padding: "20px"
                        }}
                      >
                        <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                          <img
                            src={currentPreviewImage}
                            alt="Preview Dokumentasi"
                            style={{
                              maxHeight: "90vh",
                              maxWidth: "90vw",
                              objectFit: "contain",
                              borderRadius: "8px",
                              border: "3px solid white",
                              boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
                            }}
                          />
                          <div style={{ 
                            marginTop: "16px", 
                            color: "white", 
                            fontSize: "14px",
                            fontWeight: "500"
                          }}>
                            Click outside to close
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ 
                      marginTop: "20px", 
                      padding: "12px", 
                      background: "#f9f9f9", 
                      borderRadius: "6px", 
                      border: "1px solid #e0e0e0" 
                    }}>
                      <p style={{ 
                        margin: "0 0 4px 0", 
                        fontSize: "11px", 
                        color: "#757575" 
                      }}>Inspector</p>
                      <p style={{ 
                        margin: "0", 
                        fontSize: "13px", 
                        fontWeight: "500", 
                        color: "#424242" 
                      }}>
                        {checksheetData[inspectionItems[0]?.item_key]?.inspector || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ 
                padding: "16px 24px", 
                background: "#f5f5f5", 
                borderTop: "1px solid #e0e0e0", 
                textAlign: "right" 
              }}>
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

        {/* Modal Popup Gambar Dokumentasi */}
        {showImageModal && (
          <div
            onClick={closeImageModal}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2000,
              padding: "20px"
            }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
              <img
                src={currentImageUrl}
                alt="Dokumentasi"
                style={{
                  maxHeight: "90vh",
                  maxWidth: "90vw",
                  objectFit: "contain",
                  borderRadius: "8px",
                  border: "3px solid white"
                }}
              />
              <div style={{ 
                marginTop: "16px", 
                color: "white", 
                fontSize: "14px" 
              }}>
                Click outside to close
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}