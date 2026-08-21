// app/status-ga/selang-hydrant/GaSelangHydrantContent.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import QrScanner from 'qr-scanner';
import { ArrowLeft } from "lucide-react";
import { getAreasByType, getAvailableDates, getChecklistByDate } from "@/lib/api/checksheet";

interface Area {
  id: number;
  no: number;
  name: string;
  location: string;
}

export function GaSelangHydrantContent({ openArea }: { openArea: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // ✅ Hardcode type slug untuk page ini
  const TYPE_SLUG = 'selang-hydrant';
  
  const [isMounted, setIsMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [checksheetData, setChecksheetData] = useState<any | null>(null);
  const [selectedDateInModal, setSelectedDateInModal] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // QR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!openArea) return;
    
    const found = areas.find((item) => {
      const parts = item.name.split(' • ');
      return parts[0] === openArea;
    });
    
    if (found) {
      setTimeout(() => openDetail(found), 50);
    }
  }, [isMounted, loading, openArea, areas]);

  // ✅ Open detail dengan load data dari API
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
        setSelectedDateInModal(latestDate);

        // Load checklist data untuk tanggal terbaru
        const data = await getChecklistByDate(TYPE_SLUG, area.id, latestDate);
        setChecksheetData(data);
      } else {
        setChecksheetData(null);
        setSelectedDateInModal("");
      }
    } catch (error) {
      console.error("Error loading detail:", error);
      setChecksheetData(null);
      setAvailableDates([]);
      setSelectedDateInModal("");
    } finally {
      setIsLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedArea(null);
    setChecksheetData(null);
    setSelectedDateInModal("");
    setAvailableDates([]);
    setShowModal(false);
  };

  // ✅ Load data ketika tanggal berubah
  useEffect(() => {
    if (!selectedArea || !selectedDateInModal || !showModal) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getChecklistByDate(TYPE_SLUG, selectedArea.id, selectedDateInModal);
        setChecksheetData(data);
      } catch (error) {
        console.error("Error loading checklist ", error);
        setChecksheetData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedDateInModal, selectedArea, showModal]);

  // Filter data berdasarkan search
  const filteredData = areas.filter(item => {
    const parts = item.name.split(' • ');
    const lokasi = parts[0] || '';
    const zona = parts[1] || '';
    const jenisHydrant = parts[2] || '';
    const pic = parts[3] || '';
    
    return (
      lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jenisHydrant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pic.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // ✅ Fungsi buka modal gambar
  const openImageModal = (url: string) => {
    setCurrentImageUrl(url);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImageUrl("");
  };

  // QR Scanner functions
  const openQrScanner = () => {
    setIsScanning(true);
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!isScanning || !videoRef.current) return;
    
    const video = videoRef.current;

    const onScanSuccess = (result: string) => {
      console.log("QR Scanned:", result);
      setIsScanning(false);
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }

      try {
        let urlStr = result.trim();

        if (urlStr.startsWith('http')) {
          const url = new URL(urlStr);
          if (url.pathname === '/e-checksheet-slg-hydrant') {
            router.push(urlStr);
            return;
          }
        }

        if (urlStr.startsWith('/e-checksheet-slg-hydrant?')) {
          router.push(urlStr);
          return;
        }

        alert("Invalid QR code. Please scan a valid selang hydrant inspection QR.");
      } catch (err) {
        alert("Invalid QR format.");
      }
    };

    const onScanError = (error: string | Error) => {
      console.warn("QR scan error:", error);
    };

    qrScannerRef.current = new QrScanner(
      video,
      onScanSuccess,
      onScanError
    );

    qrScannerRef.current.start();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
      }
    };
  }, [isScanning, router]);

  if (!isMounted) return null;
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        Loading...
      </div>
    );
  }
  if (!user || (user.role !== "inspector-ga")) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
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
          >
            <ArrowLeft size={18}/> Kembali
          </button>
          <div className="text-header">
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              🚒 Selang Hydrant Inspection Dashboard
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px", fontWeight: "400" }}>
              Bi-monthly inspection schedule and maintenance records
            </p>
          </div>
        </div>

        {/* Search + QR Scan */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0",
          position: "relative"
        }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Cari zona, jenis, lokasi, atau PIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "10px 40px 10px 16px",
                border: "1px solid #1976d2",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333",
                width: "100%",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "900px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Zona</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Jenis Hydrant</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Lokasi</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>PIC</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area, idx) => {
                  // Extract data from name field
                  const parts = area.name.split(' \u0007 ');
                  const lokasi = parts[0] || '';
                  const zona = parts[1] || '';
                  const jenisHydrant = parts[2] || '';
                  const pic = parts[3] || '';
                  
                  let statusLabel = "No Data";
                  let statusColor = "#757575";
                  let lastCheck = "-";

                  // ✅ Cek status dari API
                  const checkStatus = async () => {
                    try {
                      const dates = await getAvailableDates(TYPE_SLUG, area.id);
                      
                      if (dates.length > 0) {
                        const latest = dates.sort().pop();
                        lastCheck = new Date(latest!).toLocaleDateString("en-US", { day: "numeric", month: "short" });
                        statusLabel = "Checked";
                        statusColor = "#43a047";
                      }
                    } catch (error) {
                      console.error("Error checking status:", error);
                    }
                  };

                  // Panggil checkStatus
                  checkStatus();

                  return (
                    <tr key={area.id} style={{ borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{zona}</td>
                      <td style={{ padding: "14px 16px", color: "#666", fontSize: "13px" }}>
                        <span style={{
                          padding: "4px 8px",
                          background: "#e3f2fd",
                          color: "#0d47a1",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}>
                          {jenisHydrant}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#666" }}>{lokasi}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#333" }}>{pic}</td>
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
                            href={`/e-checksheet-slg-hydrant?lokasi=${encodeURIComponent(lokasi)}&zona=${encodeURIComponent(zona)}&jenisHydrant=${encodeURIComponent(jenisHydrant)}&pic=${encodeURIComponent(pic)}`}
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

        {/* Modal Detail */}
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
                    {selectedArea.name}
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
                {!selectedDateInModal ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#757575" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📅</div>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>Please select an inspection date</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    {(() => {
                      if (!checksheetData) {
                        return <div style={{ textAlign: "center", padding: "40px", color: "#9e9e9e" }}>No data found for this date</div>;
                      }

                      // Static inspection items untuk display
                      const inspectionItems = [
                        { key: "pressureTank", label: "PRESSURE TANK (STD : 7 kg/cm2)" },
                        { key: "hasilTekananDgPitot", label: "HASIL TEKANAN DG PITOT (STD : titik terjauh min. 4.5 kg/cm2)" },
                        { key: "tekananEnginePump", label: "TEKANAN ENGINE PUMP" },
                        { key: "fireHose", label: "FIRE HOSE / SELANG" },
                        { key: "valve", label: "VALVE (TIDAK SERET)" },
                        { key: "couplingNozzle", label: "COUPLING NOZZLE" },
                        { key: "couplingHydrant", label: "COUPLING HYDRANT" },
                        { key: "seal", label: "SEAL" },
                      ];

                      return (
                        <div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1200px", border: "1px solid #e0e0e0", background: "white" }}>
                            <thead>
                              <tr style={{ background: "#f5f5f5" }}>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "50px" }}>No</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", minWidth: "250px" }}>ITEM</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "100px" }}>HASIL</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "180px" }}>KETERANGAN N-OK</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "80px" }}>PIC</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "100px" }}>DUE DATE</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "80px" }}>VERIFY</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inspectionItems.map((item, index) => {
                                const entry = checksheetData[item.key];
                                const value = entry?.hasilPemeriksaan || "-";
                                return (
                                  <tr key={item.key}>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4" }}>{item.label}</td>
                                    <td style={{
                                      padding: "8px",
                                      border: "1px solid #e0e0e0",
                                      textAlign: "center",
                                      fontWeight: "700",
                                      background: value === "OK" ? "#e8f5e9" : value === "NG" ? "#ffebee" : "#fff",
                                      color: value === "OK" ? "#2e7d32" : value === "NG" ? "#c62828" : "#757575",
                                      fontSize: "11px"
                                    }}>
                                      {value === "OK" ? "✓ OK" : value === "NG" ? "✗ NG" : "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4", fontSize: "11px" }}>
                                      {entry?.keteranganTemuan || "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4", fontSize: "11px" }}>
                                      {entry?.tindakanPerbaikan || "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>
                                      {entry?.pic || "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>
                                      {entry?.dueDate ? new Date(entry.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "-"}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>
                                      {entry?.verify || "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          
                          {/* ✅ TAMPILKAN FOTO DOKUMENTASI DI SINI */}
                          {checksheetData.pressureTank?.images && checksheetData.pressureTank.images.length > 0 && (
                            <div style={{ marginTop: "24px" }}>
                              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#212121" }}>
                                📸 Documentation Photos ({checksheetData.pressureTank.images.length})
                              </h3>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "flex-start" }}>
                                {checksheetData.pressureTank.images.map((imgUrl: string, idx: number) => (
                                  <div key={idx} style={{ width: "120px", height: "120px", overflow: "hidden", borderRadius: "6px", border: "1px solid #ddd" }}>
                                    <img
                                      src={imgUrl}
                                      alt={`doc-${idx}`}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        cursor: "pointer"
                                      }}
                                      onClick={() => window.open(imgUrl, '_blank')}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ marginTop: "20px", padding: "12px", background: "#f9f9f9", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                            <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#757575" }}>Inspector</p>
                            <p style={{ margin: "0", fontSize: "13px", fontWeight: "500", color: "#424242" }}>
                              {checksheetData.pressureTank?.inspector || "N/A"}
                            </p>
                          </div>
                        </div>
                      );
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

        {/* QR Scanner Modal */}
        {isScanning && (
          <div
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
            }}
            onClick={() => {
              setIsScanning(false);
              if (qrScannerRef.current) {
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
              }
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
                maxWidth: "90vw",
                width: "100%",
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>Scan Selang Hydrant QR Code</h3>
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  maxHeight: "60vh",
                  borderRadius: "6px",
                  background: "#000"
                }}
              />
              <p style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>
                Point your camera at the QR code on the selang hydrant
              </p>
              <button
                onClick={() => {
                  setIsScanning(false);
                  if (qrScannerRef.current) {
                    qrScannerRef.current.destroy();
                    qrScannerRef.current = null;
                  }
                }}
                style={{
                  marginTop: "16px",
                  padding: "8px 20px",
                  background: "#757575",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
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
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>
                Click outside to close
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}