// app/e-checksheet-lift-barang/EChecksheetLiftBarangForm.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { Camera, File, QrCode } from "lucide-react";
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

export function EChecksheetLiftBarangForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  
  // ✅ TAMBAHKAN HOOK CONNECTION & SCAN
  const { isOnline, pendingCount } = useConnection();
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  
  const liftName = searchParams.get('liftName') || '';
  const area = searchParams.get('area') || '';
  const lokasi = searchParams.get('lokasi') || '';
  const TYPE_SLUG = 'lift-barang';
  
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [checklistData, setChecklistData] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState("");
  
  // ✅ Filter States untuk Riwayat Isian
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  
  // ✅ Image States untuk DOKUMENTASI
  const [images, setImages] = useState<{ key: string; url: string }[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentItemKey, setCurrentItemKey] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const getYear = (dateString: string) => new Date(dateString).getFullYear();
  const getMonth = (dateString: string) => new Date(dateString).getMonth();
  
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const groupDatesByYearMonth = (dates: string[]) => {
    const grouped: Record<number, Record<number, string[]>> = {};
    dates.forEach(date => {
      const year = getYear(date);
      const month = getMonth(date);
      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][month]) grouped[year][month] = [];
      grouped[year][month].push(date);
    });
    Object.values(grouped).forEach(yearData => {
      Object.values(yearData).forEach(monthDates => {
        monthDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      });
    });
    return grouped;
  };
  
  const getMaxDate = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today.toISOString().split('T')[0];
  };
  
  useEffect(() => { setIsMounted(true); }, []);
  
  useEffect(() => {
    if (!isMounted || !isInitialized) return;
    if (authLoading) return;
    if (!user) return;
    if (user.role !== "inspector-ga-equipment" && !["admin", "superadmin"].includes(user.role)) {
      router.replace("/login-page");
      return;
    }
    setAuthVerified(true);
  }, [user, authLoading, isInitialized, router, isMounted]);
  
  // Load inspection items dari DB
  useEffect(() => {
    if (!user || !authVerified) return;
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setInspectionItems(items);
      } catch (error) {
        console.error("❌ Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist.");
      }
    };
    loadItems();
  }, [user, authVerified]);
  
  // Load area data
  useEffect(() => {
    if (!lokasi || !user || !authVerified) return;
    const loadAreaData = async () => {
      try {
        const areas = await getAreasByType(TYPE_SLUG);
        
        let areaItem = areas.find((a: any) => a.location === lokasi);
        
        if (!areaItem) {
          areaItem = areas.find((a: any) => {
            const parts = a.name.split('');
            const locationDetail = parts[2]?.trim() || '';
            return locationDetail === lokasi;
          });
        }
        
        if (!areaItem) {
          areaItem = areas.find((a: any) => {
            const parts = a.name.split('');
            const locationDetail = parts[2]?.trim() || '';
            return locationDetail.includes(lokasi) || lokasi.includes(locationDetail);
          });
        }
        
        if (areaItem) {
          setAreaId(areaItem.id);
          const dates = await getAvailableDates(TYPE_SLUG, areaItem.id);
          setAvailableDates(dates);
          setSelectedDate("");
        } else {
          alert(`Area "${lokasi}" tidak ditemukan di database.`);
        }
      } catch (error) {
        console.error("❌ Failed to load area data:", error);
        alert("Gagal memuat data area.");
      }
    };
    loadAreaData();
  }, [lokasi, user, authVerified]);
  
  useEffect(() => {
    if (selectedYear === "" || selectedMonth === "") {
      setFilteredDates([]);
      return;
    }
    const grouped = groupDatesByYearMonth(availableDates);
    const datesForSelection = grouped[selectedYear]?.[selectedMonth] || [];
    setFilteredDates(datesForSelection);
  }, [selectedYear, selectedMonth, availableDates]);
  
  // ✅ FIXED: Flatten API data ke format checklistData yang digunakan oleh form
  const flattenApiDataToForm = (apiData: Record<string, any>, loadedImages: { key: string; url: string }[]) => {
    const flatData: Record<string, any> = {};
    Object.entries(apiData).forEach(([itemKey, entry]: [string, any]) => {
      flatData[`${itemKey}_hasil`] = entry.hasilPemeriksaan || "";
      flatData[`${itemKey}_keterangan`] = entry.keteranganTemuan || "";
      flatData[`${itemKey}_tindakan`] = entry.tindakanPerbaikan || "";
      flatData[`${itemKey}_pic`] = entry.pic || "";
      flatData[`${itemKey}_dueDate`] = entry.dueDate || "";
      // Extract images
      if (entry.images && Array.isArray(entry.images)) {
        entry.images.forEach((url: string) => {
          loadedImages.push({ key: itemKey, url });
        });
      }
    });
    return flatData;
  };

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
        const loadedImages: { key: string; url: string }[] = [];
        // ✅ FIXED: Flatten data dari API ke format yang bisa dipakai form
        const flatData = flattenApiDataToForm(data, loadedImages);
        setChecklistData(flatData);
        setImages(loadedImages);
        alert("✅ Data berhasil dimuat!");
      } else {
        alert("⚠️ Tidak ada data untuk tanggal ini.");
        setChecklistData({});
        setImages([]);
      }
    } catch (error) {
      console.error("❌ Error loading checklist data:", error);
      alert("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const availableYears = (() => {
    const years = new Set(availableDates.map(date => getYear(date)));
    return Array.from(years).sort((a, b) => b - a);
  })();
  
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
      checklistData[`${item.item_key}_hasil`]
    );
    
    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }
    
    try {
      setIsSaving(true);
      
      const checklistDataToSave: ChecklistData = {};
      
      inspectionItems.forEach((item) => {
        checklistDataToSave[item.item_key] = {
          date: selectedDate,
          hasilPemeriksaan: checklistData[`${item.item_key}_hasil`] || "",
          keteranganTemuan: checklistData[`${item.item_key}_keterangan`] || "",
          tindakanPerbaikan: checklistData[`${item.item_key}_tindakan`] || "",
          pic: checklistData[`${item.item_key}_pic`] || user?.fullName || "",
          dueDate: checklistData[`${item.item_key}_dueDate`] || "",
          verify: "",
          inspector: user?.fullName || "",
          images: images.filter(img => img.key === item.item_key).map(img => img.url),
          notes: ""
        };
      });

      const submitData = {
        type: TYPE_SLUG,
        areaId: areaId,
        date: selectedDate,
        data: checklistDataToSave,
        userId: user?.id || "unknown",
        userName: user?.fullName || "Unknown Inspector",
        // Data tambahan dari URL params untuk metadata
        liftName: liftName,
        area: area,
        lokasi: lokasi
      };

      // ✅ GUNAKAN SMARTFETCH UNTUK OFFLINE MODE
      const response = await smartFetch('/api/checksheet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
        queueType: 'lift_barang_checklist',
        metadata: { 
          areaCode: `lift-barang-${areaId}`,
          areaType: 'general'
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
        
        // Refresh available dates
        const dates = await getAvailableDates(TYPE_SLUG, areaId);
        setAvailableDates(dates);
        
        setTimeout(() => {
          router.push(`/status-ga/lift-barang?openLift=${encodeURIComponent(liftName)}`);
        }, 500);
      } else {
        throw new Error(result.message || 'Gagal menyimpan data');
      }
      
    } catch (error) {
      console.error("❌ Error saving checklist data:", error);
      alert("Gagal menyimpan data: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleInputChange = (field: string, value: string): void => {
    setChecklistData((prev) => ({ ...prev, [field]: value }));
  };
  
  // Image handling - sudah base64, kompatibel offline
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, itemKey: string) => {
    const files = event.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImages(prev => [...prev, { key: itemKey, url: imageUrl }]);
      };
      reader.readAsDataURL(file);
    });
    event.target.value = '';
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
  
  const openCamera = async (itemKey: string) => {
    setCurrentItemKey(itemKey);
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Tidak dapat mengakses kamera.");
      setShowCameraModal(false);
    }
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
      setCameraStream(null);
    }
  };
  
  if (!isMounted || !isInitialized || !authVerified) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>Loading...</p>
        </div>
      </div>
    );
  }
  
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
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700" }}>
              Check Sheet Lift Barang
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
              Inspeksi 2 Bulan Sekali – Goods Lift System
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
        
        {/* Info Card */}
        <div style={{
          background: "white",
          border: "1px solid #e8e8e8",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: "20px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div style={{ color: "black" }}><strong>Lift:</strong> {liftName}</div>
            <div style={{ color: "black" }}><strong>Area:</strong> {area}</div>
            <div style={{ color: "black" }}><strong>Lokasi:</strong> {lokasi}</div>
            <div style={{ color: "black" }}><strong>Inspector:</strong> {user?.fullName}</div>
          </div>
        </div>
        
        {/* Date Picker + Riwayat */}
        <div style={{
          background: "white",
          border: "2px solid #1e88e5",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          marginBottom: "20px"
        }}>
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#0d47a1", fontSize: "15px" }}>
              📅 Jadwal Inspeksi: Setiap 2 Bulan (Jan, Mar, Mei, Jul, Sep, Nov)
            </strong>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "700", color: "#0d47a1", fontSize: "14px" }}>
              Tanggal Inspeksi:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                // Reset form saat tanggal baru dipilih (inspeksi baru)
                setChecklistData({});
                setImages([]);
              }}
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
            {selectedDate && isScanned && (
              <span style={{ fontSize: "13px", color: "#43a047", fontWeight: "600" }}>
                ✅ Tanggal dipilih — silakan isi form di bawah
              </span>
            )}
          </div>
          
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
              <label style={{ fontWeight: "700", color: "#0d47a1", fontSize: "14px" }}>
                📁 Muat Riwayat:
              </label>
              
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedYear(year);
                  setSelectedMonth("");
                  setFilteredDates([]);
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
                <option value="">— Tahun —</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const month = e.target.value ? parseInt(e.target.value) : "";
                  setSelectedMonth(month);
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
                <option value="">— Bulan —</option>
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
              
              {filteredDates.length > 0 && (
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    // Reset form agar siap di-load
                    setChecklistData({});
                    setImages([]);
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
                      {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
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
                  color: (selectedDate && !isLoading && isScanned) ? "white" : "#9e9e9e",
                  border: "none",
                  borderRadius: "6px",
                  cursor: (selectedDate && !isLoading && isScanned) ? "pointer" : "not-allowed",
                  fontWeight: "600",
                  fontSize: "14px"
                }}
              >
                {isLoading ? "⏳ Memuat..." : "📥 Muat Data"}
              </button>
            </div>
          )}
        </div>
        
        {/* ✅ Tabel Checklist */}
        {inspectionItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "12px", border: "2px dashed #ccc" }}>
            <p style={{ color: "#999", fontSize: "16px", margin: 0 }}>⏳ Loading checklist items...</p>
          </div>
        ) : (
          <div style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
            border: "2px solid #0d47a1",
            marginBottom: "20px"
          }}>
            <div style={{ overflowX: "auto" }}>
              {/* ✅ FIXED: Hapus kolom VERIFY, minWidth dikurangi */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "1400px" }}>
                <thead>
                  <tr style={{ background: "#e3f2fd" }}>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "50px" }}>No</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "200px" }}>ITEM</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "180px" }}>CONTENT</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "120px" }}>METHOD</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>HASIL</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>KETERANGAN N-OK</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "150px" }}>DOKUMENTASI</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>PIC</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "120px" }}>DUE DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectionItems.map((item, index) => {
                    const itemImages = images.filter(img => img.key === item.item_key);
                    
                    return (
                      <tr key={item.id} style={{ background: index % 2 === 0 ? "white" : "#fafcff" }}>
                        <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", lineHeight: "1.5" }}>{item.item_group}</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", lineHeight: "1.5", color: "#555" }}>{item.item_check}</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", textAlign: "center" }}>{item.method}</td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>
                          <select
                            value={checklistData[`${item.item_key}_hasil`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_hasil`, e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              border: "1px solid #1e88e5", 
                              borderRadius: "4px",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed"
                            }}
                          >
                            <option value="">-</option>
                            <option value="OK">✓ OK</option>
                            <option value="NG">✗ NG</option>
                          </select>
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <textarea
                            value={checklistData[`${item.item_key}_keterangan`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_keterangan`, e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            placeholder="Keterangan jika NG..."
                            rows={2}
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              fontSize: "12px", 
                              resize: "vertical",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                            }}
                          />
                        </td>
                        {/* DOKUMENTASI */}
                        <td style={{ padding: "8px", border: "1px solid #0d47a1", verticalAlign: "top" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <button
                              onClick={() => openCamera(item.item_key)}
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
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px"
                              }}
                            >
                              <Camera size={14} /> Kamera
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
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px"
                              }}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            >
                              <File size={14} /> File
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
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                              {itemImages.map((img, idx) => (
                                <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "4px", overflow: "hidden" }}>
                                  <img
                                    src={img.url}
                                    alt={`Dokumentasi ${item.item_key} ${idx + 1}`}
                                    onClick={() => openImageModal(img.url)}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
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
                                      background: "rgba(244,67,54,0.9)",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "50%",
                                      width: "18px",
                                      height: "18px",
                                      fontSize: "12px",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <textarea
                            value={checklistData[`${item.item_key}_tindakan`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_tindakan`, e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            placeholder="Tindakan perbaikan..."
                            rows={2}
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              fontSize: "12px", 
                              resize: "vertical",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <input
                            type="text"
                            value={checklistData[`${item.item_key}_pic`] || user?.fullName || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_pic`, e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            placeholder="PIC"
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              fontSize: "12px",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <input
                            type="date"
                            value={checklistData[`${item.item_key}_dueDate`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_dueDate`, e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            style={{ 
                              width: "100%", 
                              padding: "6px",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                            }}
                          />
                        </td>
                        {/* ✅ REMOVED: Kolom VERIFY dihapus */}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/lift-barang")}
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
              disabled={!selectedDate || isSaving || !areaId || !isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              style={{
                padding: "12px 28px",
                background: (selectedDate && !isSaving && areaId && isScanned) 
                  ? "linear-gradient(135deg, #1e88e5, #0d47a1)" 
                  : "#bdbdbd",
                color: (selectedDate && !isSaving && areaId && isScanned) ? "white" : "#9e9e9e",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: (selectedDate && !isSaving && areaId && isScanned) ? "pointer" : "not-allowed",
                opacity: (selectedDate && !isSaving && areaId && isScanned) ? 1 : 0.6
              }}
            >
              {isSaving ? "⏳ Menyimpan..." : "✓ Simpan Data"}
            </button>
          ) : (
            <div style={{ padding: "12px 24px", background: "#f1f5f9", color: "#64748b", borderRadius: "8px", fontWeight: "600", fontSize: "14px", border: "1px solid #cbd5e1" }}>
              🔒 Mode View Admin (Simpan Di-nonaktifkan)
            </div>
          )}
        </div>
        
        {/* Modal Preview Gambar */}
        {showImageModal && (
          <div
            onClick={closeImageModal}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
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
                style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: "8px", border: "3px solid white" }}
              />
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>Click outside to close</div>
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
                setCameraStream(null);
              }
            }}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 2000
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
                width: "100%"
              }}
            >
              <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>📸 Ambil Foto</h3>
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
              <div style={{ marginTop: "16px", display: "flex", gap: "12px", justifyContent: "center" }}>
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
                      setCameraStream(null);
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