// app/e-checksheet-inf-jalan/EChecksheetInfJalanForm.tsx
"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import React from "react";
// ✅ Import API helper yang reusable
import {
  getItemsByType,
  getChecklistByDate,
  getAvailableDates,
  getAreasByType,
  ChecklistItem,
  ChecklistData
} from "@/lib/api/checksheet";

// ✅ TAMBAHKAN IMPORT OFFLINE & SCAN VERIFICATION
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { useScanVerification } from "@/lib/hooks/useScanVerification";
import { QrCode } from "lucide-react";

// ✅ Helper: Extract tahun dari tanggal
const getYear = (dateString: string) => new Date(dateString).getFullYear();

// ✅ Helper: Extract bulan dari tanggal (0-11)
const getMonth = (dateString: string) => new Date(dateString).getMonth();

// ✅ Helper: Format nama bulan dalam Bahasa Indonesia
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// ✅ Helper: Group dates by year and month
const groupDatesByYearMonth = (dates: string[]) => {
  const grouped: Record<number, Record<number, string[]>> = {};
  
  dates.forEach(date => {
    const year = getYear(date);
    const month = getMonth(date);
    
    if (!grouped[year]) {
      grouped[year] = {};
    }
    if (!grouped[year][month]) {
      grouped[year][month] = [];
    }
    grouped[year][month].push(date);
  });
  
  // Sort dates within each month (newest first)
  Object.values(grouped).forEach(yearData => {
    Object.values(yearData).forEach(monthDates => {
      monthDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    });
  });
  
  return grouped;
};

export function EChecksheetInfJalanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  
  // ✅ TAMBAHKAN HOOK CONNECTION & SCAN
  const { isOnline, pendingCount } = useConnection();
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  
  // ✅ Gunakan useSearchParams untuk membaca parameter
  const areaName = searchParams.get('areaName') || '';
  const kategori = searchParams.get('kategori') || '';
  const lokasi = searchParams.get('lokasi') || '';
  const TYPE_SLUG = 'inf-jalan';
  
  // ✅ CRITICAL FIX: State untuk tracking auth verification
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [images, setImages] = useState<{ key: string; url: string }[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentItemKey, setCurrentItemKey] = useState("");
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [areaId, setAreaId] = useState<number | null>(null);
  
  // ✅ Filter States untuk Riwayat Isian (3 DROPDOWN)
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // ✅ Load inspection items
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setInspectionItems(items);
      } catch (error) {
        console.error("Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist.");
      }
    };
    loadItems();
  }, []);
  
  // ✅ Load areaId dan available dates - HANYA SETELAH AUTH VERIFIED
  useEffect(() => {
    if (!areaName || !isMounted || !authVerified) return;
    const loadAreaData = async () => {
      try {
        // Format nama area sesuai database: "NAMA AREA • KATEGORI • LOKASI"
        const areaNameFormatted = `${areaName} • ${kategori} • ${lokasi}`;
        
        const areas = await getAreasByType(TYPE_SLUG);
        const area = areas.find((a: any) => a.name === areaNameFormatted);
        
        if (area) {
          setAreaId(area.id);
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          setAvailableDates(dates);
          
          // ✅ Set default filter to current year & month
          if (dates.length > 0) {
            const latestDate = dates[0];
            const currentYear = getYear(latestDate);
            const currentMonth = getMonth(latestDate);
            setSelectedYear(currentYear);
            setSelectedMonth(currentMonth);
          }
        } else {
          // Fallback: cari berdasarkan areaName saja
          const fallbackArea = areas.find((a: any) => a.name.startsWith(areaName));
          if (fallbackArea) {
            setAreaId(fallbackArea.id);
            const dates = await getAvailableDates(TYPE_SLUG, fallbackArea.id);
            setAvailableDates(dates);
            
            if (dates.length > 0) {
              const latestDate = dates[0];
              const currentYear = getYear(latestDate);
              const currentMonth = getMonth(latestDate);
              setSelectedYear(currentYear);
              setSelectedMonth(currentMonth);
            }
          } else {
            alert(`Area "${areaName}" tidak ditemukan.`);
          }
        }
      } catch (error) {
        console.error("Failed to load area data:", error);
        alert("Gagal memuat data area.");
      }
    };
    
    loadAreaData();
  }, [areaName, kategori, lokasi, isMounted, authVerified]);
  
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
  
  // ✅ Camera useEffect
  useEffect(() => {
    if (!showCameraModal) return;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        
        setCameraStream(stream);
        if (videoRef.current) {
          (videoRef.current as any).srcObject = stream;
        }
      } catch (err) {
        console.error("❌ Gagal membuka kamera:", err);
        alert("Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan.");
        setShowCameraModal(false);
      }
    };
    
    startCamera();
    
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCameraModal]);
  
  // ✅ Filter dates when year or month changes (3 DROPDOWN SYSTEM)
  useEffect(() => {
    if (selectedYear === "" || selectedMonth === "") {
      setFilteredDates([]);
      return;
    }
    
    const grouped = groupDatesByYearMonth(availableDates);
    const datesForSelection = grouped[selectedYear]?.[selectedMonth] || [];
    
    setFilteredDates(datesForSelection);
    
    // ✅ FIXED: TIDAK AUTO-SELECT tanggal
    // Biarkan selectedDate tetap kosong, user harus pilih manual
  }, [selectedYear, selectedMonth, availableDates]);
  
  // ✅ Load existing data - HANYA saat user klik "Muat Data"
  const handleLoadExisting = async () => {
    if (!selectedDate) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }
    if (!areaId) {
      alert("Area tidak valid!");
      return;
    }
    try {
      setIsLoading(true);
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      
      if (data) {
        const existingData: Record<string, string> = {};
        const loadedImages: { key: string; url: string }[] = [];
        
        Object.entries(data).forEach(([itemKey, entry]: [string, any]) => {
          existingData[`${itemKey}_hasil`] = entry.hasilPemeriksaan || "";
          existingData[`${itemKey}_keterangan`] = entry.keteranganTemuan || "";
          existingData[`${itemKey}_tindakan`] = entry.tindakanPerbaikan || "";
          existingData[`${itemKey}_pic`] = entry.pic || "";
          existingData[`${itemKey}_dueDate`] = entry.dueDate || "";
          existingData[`${itemKey}_verify`] = entry.verify || "";
          
          if (entry.images && Array.isArray(entry.images)) {
            entry.images.forEach((url: string) => {
              loadedImages.push({ key: itemKey, url });
            });
          }
        });
        
        setAnswers(existingData);
        setImages(loadedImages);
        alert("Data berhasil dimuat!");
      } else {
        alert("Tidak ada data untuk tanggal ini.");
        setAnswers({});
        setImages([]);
      }
    } catch (error) {
      console.error("Error loading checklist data:", error);
      alert("Gagal memuat data.");
    } finally {
      setIsLoading(false);
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
      alert("Pilih tanggal pemeriksaan terlebih dahulu!");
      return;
    }
    if (!areaId) {
      alert("Area tidak valid!");
      return;
    }
    
    const allFieldsFilled = inspectionItems.every((item) => 
      answers[`${item.item_key}_hasil`]
    );
    
    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const checklistData: ChecklistData = {};
      
      inspectionItems.forEach((item) => {
        checklistData[item.item_key] = {
          date: selectedDate,
          hasilPemeriksaan: answers[`${item.item_key}_hasil`] || "",
          keteranganTemuan: answers[`${item.item_key}_keterangan`] || "",
          tindakanPerbaikan: answers[`${item.item_key}_tindakan`] || "",
          pic: answers[`${item.item_key}_pic`] || "",
          dueDate: answers[`${item.item_key}_dueDate`] || "",
          verify: answers[`${item.item_key}_verify`] || "",
          inspector: user.fullName || "",
          images: images
            .filter(img => img.key === item.item_key)
            .map(img => img.url),
          notes: ""
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
        areaName: areaName,
        kategori: kategori,
        lokasi: lokasi
      };

      // ✅ GUNAKAN SMARTFETCH UNTUK OFFLINE MODE
      const response = await smartFetch('/api/checksheet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
        queueType: 'inf_jalan_inspeksi',
        metadata: { areaCode: `inf-jalan-${areaName}` }
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
        router.push(`/status-ga/inf-jalan?openArea=${encodeURIComponent(areaName)}`);
      } else {
        throw new Error(result.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error("Error saving checklist data:", error);
      alert("Gagal menyimpan data: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (field: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };
  
  // ✅ Upload foto sudah base64, kompatibel offline
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, itemKey: string) => {
    const files = event.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { key: itemKey, url: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const openImageModal = (imgUrl: string) => {
    setCurrentImage(imgUrl);
    setShowImageModal(true);
  };
  
  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImage("");
  };
  
  const openCamera = (itemKey: string) => {
    setCurrentItemKey(itemKey);
    setShowCameraModal(true);
  };
  
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current as any;
    const canvas = canvasRef.current as any;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
    setImages(prev => [...prev, { key: currentItemKey, url: imageUrl }]);
    setShowCameraModal(false);
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
  };
  
  // ✅ FIX: Hitung tanggal maksimum dengan benar
  const getMaxDate = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today.toISOString().split('T')[0];
  };
  
  // ✅ Get unique years from available dates
  const availableYears = useMemo(() => {
    const years = new Set(availableDates.map(date => getYear(date)));
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [availableDates]);
  
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
        paddingLeft: "95px",
        paddingRight: "25px",
        paddingTop: "32px",
        paddingBottom: "32px",
        maxWidth: "100%",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            background: "linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)"
          }}>
            <h1 style={{
              margin: "0 0 8px 0",
              color: "white",
              fontSize: "clamp(20px, 5vw, 28px)",
              fontWeight: "700"
            }}>
              Check Sheet Inspeksi Infrastruktur Jalan
            </h1>
            <p style={{
              margin: 0,
              color: "rgba(255,255,255,0.9)",
              fontSize: "14px"
            }}>
              Form Pemeriksaan Kelayakan Jalan & Boardess
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
              disabled={isLoading}
            >
              <QrCode size={14} /> Scan Sekarang
            </button>
          </div>
        ) : null}
        
        {/* Info Area */}
        <div style={{
          background: "white",
          border: "1px solid #e8e8e8",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: "20px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Nama Area</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{areaName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Kategori</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{kategori}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Lokasi</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{lokasi}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>PIC Pengecekan</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{user?.fullName}</span>
            </div>
          </div>
        </div>
        
        {/* Date Selection */}
        <div style={{
          background: "white",
          border: "2px solid #1e88e5",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: "20px"
        }}>
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ 
              color: "#0d47a1",
              fontSize: "15px"
            }}>
              📅 Jadwal Inspeksi: Setiap Minggu
            </strong>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            flexWrap: "wrap", 
            marginBottom: "12px" 
          }}>
            <label style={{ 
              fontWeight: "700", 
              color: "#0d47a1",
              fontSize: "14px"
            }}>
              Tanggal Pemeriksaan:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getMaxDate()}
              disabled={!isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              style={{
                color: "#0d47a1",
                padding: "8px 12px",
                border: "2px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "14px",
                minWidth: "160px",
                background: isScanned ? "white" : "#f5f5f5",
                cursor: isScanned ? "text" : "not-allowed"
              }}
            />
          </div>
          
          {/* ✅ RIWAYAT ISIAN dengan 3 DROPDOWN (Tahun, Bulan, Tanggal) */}
          {availableDates.length > 0 && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              flexWrap: "wrap",
              padding: "12px",
              background: "#f5f9ff",
              borderRadius: "8px",
              border: "1px solid #e3f2fd"
            }}>
              <label style={{ 
                fontWeight: "700", 
                color: "#0d47a1",
                fontSize: "14px"
              }}>
                📁 Riwayat Isian:
              </label>
              
              {/* Dropdown Tahun */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedYear(year);
                  setSelectedMonth(""); // Reset month when year changes
                  setSelectedDate(""); // Reset date when year changes
                  console.log('📅 Year changed:', year);
                }}
                disabled={!isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  color: "#0d47a1",
                  padding: "8px 12px",
                  border: "2px solid #1e88e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "100px",
                  background: isScanned ? "white" : "#f5f5f5",
                  cursor: isScanned ? "pointer" : "not-allowed",
                  fontWeight: "500"
                }}
              >
                <option value="">— Pilih Tahun —</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              {/* Dropdown Bulan */}
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const month = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedMonth(month);
                  setSelectedDate(""); // Reset date when month changes
                  console.log('📅 Month changed:', month);
                }}
                disabled={selectedYear === "" || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  color: (selectedYear === "" || !isScanned) ? "#999" : "#0d47a1",
                  padding: "8px 12px",
                  border: "2px solid #1e88e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "140px",
                  background: (selectedYear !== "" && isScanned) ? "white" : "#f5f5f5",
                  cursor: (selectedYear !== "" && isScanned) ? "pointer" : "not-allowed",
                  fontWeight: "500"
                }}
              >
                <option value="">— Pilih Bulan —</option>
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              
              {/* Dropdown Tanggal (setelah tahun & bulan dipilih) */}
              {filteredDates.length > 0 && (
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    const date = e.target.value;
                    setSelectedDate(date);
                    console.log('📅 Date selected from filter:', date);
                  }}
                  disabled={!isScanned}
                  title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                  style={{
                    color: "#0d47a1",
                    padding: "8px 12px",
                    border: "2px solid #1e88e5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minWidth: "160px",
                    background: isScanned ? "white" : "#f5f5f5",
                    cursor: isScanned ? "pointer" : "not-allowed",
                    fontWeight: "500"
                  }}
                >
                  <option value="">— Pilih Tanggal —</option>
                  {filteredDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </option>
                  ))}
                </select>
              )}
              
              <button
                onClick={handleLoadExisting}
                disabled={!selectedDate || isLoading || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  padding: "8px 16px",
                  background: (selectedDate && !isLoading && isScanned) ? "#ff9800" : "#bdbdbd",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: (selectedDate && !isLoading && isScanned) ? "pointer" : "not-allowed",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                {isLoading ? "Memuat..." : "Muat Data"}
              </button>
            </div>
          )}
          
          <p style={{
            margin: "12px 0 0 0",
            fontSize: "12px",
            color: "#666",
            fontStyle: "italic"
          }}>
            💡 Pilih tanggal pemeriksaan, lalu isi form di bawah. Klik "Muat Data" jika ingin mengedit data yang sudah ada.
          </p>
        </div>
        
        {/* Tabel Checklist */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
          border: "2px solid #0d47a1",
          marginBottom: "20px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "clamp(11px, 2.5vw, 13px)",
              minWidth: "1000px"
            }}>
              <thead>
                <tr style={{ background: "#e3f2fd" }}>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "50px"
                  }}>No</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "left",
                    minWidth: "300px"
                  }}>Item Pengecekan</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "100px"
                  }}>HASIL <br/>PEMERIKSAAN</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "180px"
                  }}>KETERANGAN TEMUAN</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "180px"
                  }}>DOKUMENTASI</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "180px"
                  }}>TINDAKAN PERBAIKAN</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "80px"
                  }}>PIC</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "100px"
                  }}>DUE DATE</th>
                  {/* ✅ KOLOM VERIFY DIHAPUS */}
                </tr>
              </thead>
              <tbody>
                {inspectionItems.map((item, index) => (
                  <tr key={item.item_key}>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      textAlign: "center",
                      fontWeight: "600",
                      background: "white"
                    }}>
                      {item.no}
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      lineHeight: "1.4",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <div>{item.item_check}</div>
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      textAlign: "center",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <select
                        value={answers[`${item.item_key}_hasil`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_hasil`, e.target.value)}
                        disabled={!selectedDate || !isScanned}
                        title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        style={{
                          width: "100%",
                          padding: "4px",
                          border: "1px solid #1e88e5",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed",
                          opacity: (selectedDate && isScanned) ? 1 : 0.5,
                          background: (selectedDate && isScanned) ? "white" : "#f5f5f5"
                        }}
                      >
                        <option value="">-</option>
                        <option value="OK">✓ OK</option>
                        <option value="NG">✗ NG</option>
                      </select>
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <textarea
                        value={answers[`${item.item_key}_keterangan`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_keterangan`, e.target.value)}
                        disabled={!selectedDate || !isScanned}
                        title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        placeholder="Keterangan..."
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "11px",
                          resize: "vertical",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          opacity: (selectedDate && isScanned) ? 1 : 0.5,
                          background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                          cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white",
                      textAlign: "center",
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => {
                              setCurrentItemKey(item.item_key);
                              setShowCameraModal(true);
                            }}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            style={{
                              padding: "4px 8px",
                              background: (selectedDate && isScanned) ? "#1e88e5" : "#bdbdbd",
                              color: "white",
                              borderRadius: "4px",
                              fontSize: "11px",
                              cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed",
                              textAlign: "center",
                              whiteSpace: "nowrap",
                              border: "none"
                            }}
                          >
                            📷 Kamera
                          </button>
                          <label
                            htmlFor={`file-${item.item_key}`}
                            style={{
                              padding: "4px 8px",
                              background: (selectedDate && isScanned) ? "#4caf50" : "#bdbdbd",
                              color: "white",
                              borderRadius: "4px",
                              fontSize: "11px",
                              cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed",
                              textAlign: "center",
                              whiteSpace: "nowrap"
                            }}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          >
                            🖼️ File
                          </label>
                          <input
                            id={`file-${item.item_key}`}
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={!selectedDate || !isScanned}
                            onChange={(e) => handleImageUpload(e, item.item_key)}
                            style={{ display: "none" }}
                          />
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {images.filter(img => img.key === item.item_key).map((img, idx) => (
                            <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "4px", overflow: "hidden", cursor: "pointer" }}>
                              <img
                                src={img.url}
                                alt={`Dokumentasi ${item.item_key} ${idx + 1}`}
                                onClick={() => openImageModal(img.url)}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: "4px"
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(images.findIndex(i => i.key === item.item_key && i.url === img.url));
                                }}
                                disabled={!isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                style={{
                                  position: "absolute",
                                  top: "2px",
                                  right: "2px",
                                  background: "rgba(0,0,0,0.5)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "16px",
                                  height: "16px",
                                  fontSize: "10px",
                                  cursor: "pointer",
                                  padding: "0"
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <textarea
                        value={answers[`${item.item_key}_tindakan`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_tindakan`, e.target.value)}
                        disabled={!selectedDate || !isScanned}
                        title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        placeholder="Tindakan..."
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "11px",
                          resize: "vertical",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          opacity: (selectedDate && isScanned) ? 1 : 0.5,
                          background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                          cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <input
                        type="text"
                        value={answers[`${item.item_key}_pic`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_pic`, e.target.value)}
                        disabled={!selectedDate || !isScanned}
                        title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        placeholder="PIC"
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "11px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          opacity: (selectedDate && isScanned) ? 1 : 0.5,
                          background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                          cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <input
                        type="date"
                        value={answers[`${item.item_key}_dueDate`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_dueDate`, e.target.value)}
                        disabled={!selectedDate || !isScanned}
                        title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "11px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          opacity: (selectedDate && isScanned) ? 1 : 0.5,
                          background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                          cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                        }}
                      />
                    </td>
                    {/* ✅ KOLOM VERIFY DIHAPUS */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          justifyContent: "center", 
          padding: "20px 0" 
        }}>
          <button
            onClick={() => router.push("/status-ga/inf-jalan")}
            style={{
              padding: "12px 28px",
              background: "#bdbdbd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            ← Kembali
          </button>
          {!(user && ["admin", "superadmin"].includes(user.role)) ? (
            <button
              onClick={handleSave}
              disabled={!selectedDate || isLoading || !areaId || !isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              style={{
                padding: "12px 28px",
                background: (selectedDate && !isLoading && areaId && isScanned) 
                  ? "linear-gradient(135deg, #1e88e5, #0d47a1)" 
                  : "#bdbdbd",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: (selectedDate && !isLoading && areaId && isScanned) ? "pointer" : "not-allowed",
                opacity: (selectedDate && !isLoading && areaId && isScanned) ? 1 : 0.6
              }}
            >
              {isLoading ? "⏳ Menyimpan..." : "✓ Simpan Data"}
            </button>
          ) : (
            <div style={{ padding: "12px 24px", background: "#f1f5f9", color: "#64748b", borderRadius: "8px", fontWeight: "600", fontSize: "14px", border: "1px solid #cbd5e1" }}>
              🔒 Mode View Admin (Simpan Di-nonaktifkan)
            </div>
          )}
        </div>
        
        {/* Modal Gambar */}
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
                src={currentImage}
                alt="Dokumentasi"
                style={{
                  maxHeight: "90vh",
                  maxWidth: "90vw",
                  objectFit: "contain",
                  borderRadius: "8px",
                  border: "3px solid white",
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
        
        {/* Modal Kamera */}
        {showCameraModal && (
          <div
            onClick={() => {
              setShowCameraModal(false);
              if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
              }
            }}
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
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "16px 20px",
                textAlign: "center",
                maxWidth: "90vw",
                width: "100%",
              }}
            >
              <h3 style={{ 
                margin: "0 0 12px 0", 
                color: "#212121" 
              }}>
                📸 Ambil Foto
              </h3>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  maxHeight: "60vh",
                  borderRadius: "6px",
                  background: "#000",
                  transform: "scaleX(-1)"
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div style={{ 
                marginTop: "16px", 
                display: "flex", 
                gap: "12px", 
                justifyContent: "center" 
              }}>
                <button
                  onClick={captureImage}
                  style={{
                    padding: "10px 20px",
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  📸 Ambil Foto
                </button>
                <button
                  onClick={() => {
                    setShowCameraModal(false);
                    if (cameraStream) {
                      cameraStream.getTracks().forEach(track => track.stop());
                    }
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

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
        `}</style>
      </div>
    </div>
  );
}