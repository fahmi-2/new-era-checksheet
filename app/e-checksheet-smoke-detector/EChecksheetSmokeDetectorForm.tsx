// app/e-checksheet-smoke-detector/EChecksheetSmokeDetectorForm.tsx
"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

// ✅ TAMBAHKAN IMPORT OFFLINE & SCAN VERIFICATION
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { useScanVerification } from "@/lib/hooks/useScanVerification";
import { QrCode } from "lucide-react";

interface ChecklistItem {
  id: number;
  item_key: string;
  no: number;
  item_group: string;
  item_check: string;
  method: string;
  image: string | null;
}

interface ItemData {
  hasilPemeriksaan: string;
  keteranganTemuan: string;
  tindakanPerbaikan: string;
  pic: string;
  dueDate: string;
  verify: string;
  images: string[];
  notes: string;
}

interface AreaInfo {
  id: number;
  no: number;
  name: string;
  location: string;
  detector_type?: string;
}

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

export function EChecksheetSmokeDetectorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  
  // ✅ TAMBAHKAN HOOK CONNECTION & SCAN
  const { isOnline, pendingCount } = useConnection();
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  
  // ✅ Ambil areaId dari query string
  const areaId = searchParams.get('areaId');
  const locationParam = searchParams.get('location');
  const unitParam = searchParams.get('unit');
  
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  
  // Data from API
  const [areaInfo, setAreaInfo] = useState<AreaInfo | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistData, setChecklistData] = useState<Record<string, ItemData>>({});
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [images, setImages] = useState<{ key: string; url: string }[]>([]);
  
  // Loading states
  const [loadingArea, setLoadingArea] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingDates, setLoadingDates] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ Filter States untuk Riwayat Isian
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  
  // ✅ Camera & Image States
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentItemKey, setCurrentItemKey] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const TYPE_SLUG = 'smoke-detector';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auth check
  useEffect(() => {
    if (!isMounted || !isInitialized) return;
    if (authLoading) return;
    if (!user) {
      console.log('⏳ Waiting for user data...');
      return;
    }
    if (user.role !== "inspector-ga-fire" && user.role !== "group-leader-qa" && !["admin", "superadmin"].includes(user.role)) {
      console.warn('⚠️ Unauthorized - wrong role:', user.role);
      router.replace("/login-page");
      return;
    }
    console.log('✅ Access granted:', user.fullName, 'Role:', user.role);
  }, [user, authLoading, isInitialized, router, isMounted]);

  // ✅ Validasi areaId
  useEffect(() => {
    if (isMounted && !areaId) {
      alert('Area ID tidak ditemukan. Silakan pilih area dari halaman sebelumnya.');
      router.push('/status-ga/smoke-detector');
    }
  }, [isMounted, areaId, router]);

  // Fetch area info
  useEffect(() => {
    if (!isMounted || !areaId) return;
    const fetchAreaInfo = async () => {
      try {
        setLoadingArea(true);
        const response = await fetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/areas`);
        const result = await response.json();
        
        if (result.success) {
          const area = result.data.find((a: any) => a.id === parseInt(areaId));
          if (area) {
            console.log('✅ Found area:', area);
            setAreaInfo(area);
          } else {
            alert('Area tidak ditemukan');
            router.push('/status-ga/smoke-detector');
          }
        }
      } catch (error) {
        console.error('Error fetching area:', error);
        alert('Gagal memuat informasi area');
      } finally {
        setLoadingArea(false);
      }
    };

    fetchAreaInfo();
  }, [isMounted, areaId, router]);

  // Fetch checklist items
  useEffect(() => {
    if (!isMounted) return;
    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        const response = await fetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/items`);
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Loaded inspection items:', result.data.length);
          setChecklistItems(result.data);
          
          // Initialize empty data for each item
          const initialData: Record<string, ItemData> = {};
          result.data.forEach((item: ChecklistItem) => {
            initialData[item.item_key] = {
              hasilPemeriksaan: '',
              keteranganTemuan: '',
              tindakanPerbaikan: '',
              pic: user?.fullName || '', // ✅ Auto-fill PIC dengan nama user
              dueDate: '',
              verify: '',
              images: [],
              notes: ''
            };
          });
          setChecklistData(initialData);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [isMounted, user]);

  // Fetch available dates
  useEffect(() => {
    if (!isMounted || !areaId) return;
    const fetchDates = async () => {
      try {
        setLoadingDates(true);
        const response = await fetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/by-area/${areaId}/dates`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const sortedDates = result.data.sort((a: string, b: string) => 
            new Date(b).getTime() - new Date(a).getTime()
          );
          console.log('📅 Available dates:', sortedDates.length);
          setAvailableDates(sortedDates);
          
          // ✅ Set default filter to current year & month
          if (sortedDates.length > 0) {
            const latestDate = sortedDates[0];
            const currentYear = getYear(latestDate);
            const currentMonth = getMonth(latestDate);
            setSelectedYear(currentYear);
            setSelectedMonth(currentMonth);
          }
        }
      } catch (error) {
        console.error('Error fetching dates:', error);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchDates();
  }, [isMounted, areaId]);

  // ✅ Filter dates when year or month changes
  useEffect(() => {
    if (selectedYear === "" || selectedMonth === "") {
      setFilteredDates([]);
      return;
    }
    
    const grouped = groupDatesByYearMonth(availableDates);
    const datesForSelection = grouped[selectedYear]?.[selectedMonth] || [];
    
    setFilteredDates(datesForSelection);
    
    // ✅ Auto-select latest date when month changes
    if (datesForSelection.length > 0 && !selectedDate) {
      setSelectedDate(datesForSelection[0]);
    }
  }, [selectedYear, selectedMonth, availableDates, selectedDate]);

  // ✅ Get unique years from available dates
  const availableYears = useMemo(() => {
    const years = new Set(availableDates.map(date => getYear(date)));
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [availableDates]);

  // Load existing data when date is selected
  useEffect(() => {
    if (!selectedDate || !areaId) {
      return;
    }
    const loadExistingData = async () => {
      try {
        setIsLoading(true);
        console.log('📥 Loading existing data for date:', selectedDate);
        const response = await fetch(
          `/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/by-area/${areaId}/${selectedDate}`
        );
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ Data loaded successfully');
          
          // Load checklist data
          setChecklistData(result.data);
          
          // Load images
          const loadedImages: { key: string; url: string }[] = [];
          Object.entries(result.data).forEach(([itemKey, entry]: [string, any]) => {
            if (entry.images && Array.isArray(entry.images)) {
              entry.images.forEach((url: string) => {
                loadedImages.push({ key: itemKey, url });
              });
            }
          });
          setImages(loadedImages);
          
          alert("✅ Data berhasil dimuat!");
        } else {
          console.log('⚠️ No data found for this date');
          alert("⚠️ Tidak ada data untuk tanggal ini.");
          
          // Reset to empty with PIC auto-filled
          const emptyData: Record<string, ItemData> = {};
          checklistItems.forEach((item) => {
            emptyData[item.item_key] = {
              hasilPemeriksaan: '',
              keteranganTemuan: '',
              tindakanPerbaikan: '',
              pic: user?.fullName || '', // ✅ Auto-fill PIC
              dueDate: '',
              verify: '',
              images: [],
              notes: ''
            };
          });
          setChecklistData(emptyData);
          setImages([]);
        }
      } catch (error) {
        console.error('Error loading existing data:', error);
        alert("Gagal memuat data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [selectedDate, areaId, checklistItems, user]);

  const updateItemData = (itemKey: string, field: keyof ItemData, value: any) => {
    setChecklistData(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: value
      }
    }));
  };

  // ✅ MODIFIKASI handleSave MENGGUNAKAN SMARTFETCH
  const handleSave = async () => {
    if (!selectedDate) {
      alert("Silakan pilih tanggal inspeksi");
      return;
    }
    if (!areaId) {
      alert("Area tidak valid");
      return;
    }
    
    // Validate that at least one item has a result
    const hasData = Object.values(checklistData).some(
      item => item.hasilPemeriksaan !== ''
    );

    if (!hasData) {
      alert("Silakan lengkapi minimal satu item inspeksi");
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving checklist data...');

      const submitData = {
        checklistData,
        inspectorId: user?.id || '',
        inspectorName: user?.fullName || '',
        status: 'submitted',
        // Data tambahan untuk metadata
        areaId: areaId,
        date: selectedDate,
        location: areaInfo?.location || locationParam || ''
      };
      
      // ✅ GUNAKAN SMARTFETCH UNTUK OFFLINE MODE
      const response = await smartFetch(
        `/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/by-area/${areaId}/${selectedDate}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
          queueType: 'smoke_detector_inspeksi',
          metadata: { 
            areaCode: `smoke-detector-${areaId}`,
            areaType: 'general'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log('✅ Data saved successfully');
        alert(`✅ Data inspeksi berhasil disimpan untuk ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
        router.push(`/status-ga/smoke-detector?openArea=${encodeURIComponent(areaInfo?.location || locationParam || '')}`);
      } else {
        alert(`❌ Gagal menyimpan: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Save failed:', error);
      alert('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ Camera Functions
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

  const openCamera = (itemKey: string) => {
    if (!selectedDate) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }
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
    
    // Update checklist data with new image
    setChecklistData(prev => ({
      ...prev,
      [currentItemKey]: {
        ...prev[currentItemKey],
        images: [...(prev[currentItemKey]?.images || []), imageUrl]
      }
    }));
    
    setShowCameraModal(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
  };

  // ✅ Image Upload Functions - sudah base64, kompatibel offline
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, itemKey: string) => {
    if (!selectedDate) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }
    const files = event.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImages(prev => [...prev, { key: itemKey, url: imageUrl }]);
        
        // Update checklist data with new image
        setChecklistData(prev => ({
          ...prev,
          [itemKey]: {
            ...prev[itemKey],
            images: [...(prev[itemKey]?.images || []), imageUrl]
          }
        }));
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    event.target.value = '';
  };

  const removeImage = (index: number, itemKey: string) => {
    const imageToRemove = images[index];
    setImages(prev => prev.filter((_, i) => i !== index));
    
    // Update checklist data
    setChecklistData(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        images: (prev[itemKey]?.images || []).filter(url => url !== imageToRemove.url)
      }
    }));
  };

  const openImageModal = (imgUrl: string) => {
    setCurrentImage(imgUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImage("");
  };

  // Loading states
  if (!isMounted || !isInitialized || authLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>Loading...</p>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>Please wait</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (!areaId) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "18px", color: "#757575" }}>Area ID tidak ditemukan</p>
        </div>
      </div>
    );
  }

  if (loadingArea || loadingItems) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!areaInfo) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "18px", color: "#757575" }}>Area tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const extractZone = (name: string): string => {
    const match = name.match(/Zone\s*(\d+)/i);
    return match ? `Zone ${match[1]}` : '-';
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
      <div style={{ paddingLeft: "95px", paddingRight: "25px", paddingTop: "32px", paddingBottom: "32px", maxWidth: "100%", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ background: "linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)" }}>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700" }}>
              🔔 Smoke Detector Inspection Form
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
              Bi-monthly inspection checklist
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
              disabled={saving || isLoading}
            >
              <QrCode size={14} /> Scan Sekarang
            </button>
          </div>
        ) : null}

        {/* Area Info */}
        <div style={{ background: "white", border: "1px solid #e8e8e8", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div style={{ color: "black" }}><strong>Unit:</strong> {areaInfo.no}</div>
            <div style={{ color: "black" }}><strong>Lokasi:</strong> {areaInfo.location}</div>
            <div style={{ color: "black" }}><strong>Zone:</strong> {extractZone(areaInfo.name)}</div>
            <div style={{ color: "black" }}><strong>Tipe:</strong> {areaInfo.detector_type || 'SMOKE DETECTOR'}</div>
            <div style={{ color: "black" }}><strong>Inspector:</strong> {user.fullName}</div>
          </div>
        </div>

        {/* Date Selection with Year/Month Filter */}
        <div style={{ background: "white", border: "2px solid #1e88e5", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#0d47a1", fontSize: "15px" }}>
              📅 Jadwal Inspeksi: Setiap 2 Bulan (Jan, Mar, Mei, Jul, Sep, Nov)
            </strong>
          </div>

          {/* Input Tanggal Manual */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "700", color: "#0d47a1", fontSize: "14px" }}>Tanggal Inspeksi:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                console.log('📅 Date input changed:', e.target.value);
                setSelectedDate(e.target.value);
              }}
              max={new Date().toISOString().split('T')[0]}
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

          {/* ✅ RIWAYAT ISIAN dengan Filter Tahun & Bulan */}
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
                onClick={async () => {
                  if (!selectedDate) {
                    alert("Pilih tanggal terlebih dahulu!");
                    return;
                  }
                  if (!areaId) {
                    alert("Area tidak valid!");
                    return;
                  }
                  setIsLoading(true);
                  try {
                    console.log('📥 Loading existing data for date:', selectedDate);
                    const response = await fetch(
                      `/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/by-area/${areaId}/${selectedDate}`
                    );
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                      console.log('✅ Data loaded successfully');
                      setChecklistData(result.data);
                      
                      // Load images
                      const loadedImages: { key: string; url: string }[] = [];
                      Object.entries(result.data).forEach(([itemKey, entry]: [string, any]) => {
                        if (entry.images && Array.isArray(entry.images)) {
                          entry.images.forEach((url: string) => {
                            loadedImages.push({ key: itemKey, url });
                          });
                        }
                      });
                      setImages(loadedImages);
                      
                      alert("✅ Data berhasil dimuat!");
                    } else {
                      console.log('⚠️ No data found for this date');
                      alert("⚠️ Tidak ada data untuk tanggal ini.");
                    }
                  } catch (error) {
                    console.error('❌ Error loading data:', error);
                    alert("Gagal memuat data.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
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

          {/* Debug info (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              marginTop: "12px",
              padding: "8px 12px",
              background: "#f0f0f0",
              borderRadius: "6px",
              fontSize: "11px",
              color: "#666"
            }}>
              <strong>Debug Info:</strong><br/>
              selectedDate: {selectedDate || '(empty)'}<br/>
              selectedYear: {selectedYear || '(empty)'}<br/>
              selectedMonth: {selectedMonth !== "" ? monthNames[selectedMonth] : '(empty)'}<br/>
              availableDates count: {availableDates.length}<br/>
              filteredDates count: {filteredDates.length}<br/>
              areaId: {areaId || '(null)'}
            </div>
          )}
        </div>

        {/* Checklist Table */}
        {checklistItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "12px", border: "2px dashed #ccc" }}>
            <p style={{ color: "#999", fontSize: "16px", margin: 0 }}>⏳ Loading checklist items...</p>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", border: "2px solid #0d47a1", marginBottom: "20px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1400px" }}>
                <thead>
                  <tr style={{ background: "#e3f2fd" }}>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "50px" }}>No</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "250px" }}>ITEM</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>HASIL</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "180px" }}>Findings (if NG)</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "200px" }}>Dokumentasi</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "180px" }}>Corrective Action</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "120px" }}>PIC</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "120px" }}>Due Date</th>
                    <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Verified By</th>
                  </tr>
                </thead>
                <tbody>
                  {checklistItems.map((item, index) => {
                    const data = checklistData[item.item_key] || {};
                    const itemImages = images.filter(img => img.key === item.item_key);
                    
                    return (
                      <tr key={item.id}>
                        <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", lineHeight: "1.5" }}>
                          <div style={{ marginBottom: "4px" }}>{item.item_check}</div>
                          {item.method && (
                            <div style={{ fontSize: "11px", color: "#757575", fontStyle: "italic" }}>
                              Method: {item.method}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>
                          <select
                            value={data.hasilPemeriksaan || ''}
                            onChange={(e) => updateItemData(item.item_key, 'hasilPemeriksaan', e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              border: "1px solid #1e88e5", 
                              borderRadius: "4px",
                              fontWeight: "500",
                              fontSize: "14px",
                              outline: "none",
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
                            value={data.keteranganTemuan || ''}
                            onChange={(e) => updateItemData(item.item_key, 'keteranganTemuan', e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            placeholder="Describe any issues..."
                            rows={2}
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              fontSize: "12px", 
                              resize: "vertical",
                              border: "1px solid #d0d0d0",
                              borderRadius: "4px",
                              outline: "none",
                              fontFamily: "inherit",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
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
                                textAlign: "center"
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
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                              {itemImages.map((img, idx) => (
                                <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "4px", overflow: "hidden" }}>
                                  <img
                                    src={img.url}
                                    alt={`Dokumentasi ${item.item_key} ${idx + 1}`}
                                    onClick={() => openImageModal(img.url)}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      cursor: "pointer"
                                    }}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeImage(images.findIndex(i => i.key === item.item_key && i.url === img.url), item.item_key);
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
                            value={data.tindakanPerbaikan || ''}
                            onChange={(e) => updateItemData(item.item_key, 'tindakanPerbaikan', e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            placeholder="Action taken..."
                            rows={2}
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              fontSize: "12px", 
                              resize: "vertical",
                              border: "1px solid #d0d0d0",
                              borderRadius: "4px",
                              outline: "none",
                              fontFamily: "inherit",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <input
                            type="text"
                            value={data.pic || user?.fullName || ''}
                            onChange={(e) => updateItemData(item.item_key, 'pic', e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            placeholder="Name"
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              fontSize: "12px",
                              border: "1px solid #d0d0d0",
                              borderRadius: "4px",
                              outline: "none",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <input
                            type="date"
                            value={data.dueDate || ''}
                            onChange={(e) => updateItemData(item.item_key, 'dueDate', e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            style={{ 
                              width: "100%", 
                              padding: "6px",
                              border: "1px solid #d0d0d0",
                              borderRadius: "4px",
                              outline: "none",
                              fontSize: "12px",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <input
                            type="text"
                            value={data.verify || ''}
                            onChange={(e) => updateItemData(item.item_key, 'verify', e.target.value)}
                            disabled={!selectedDate || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            placeholder="Name"
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              fontSize: "12px",
                              border: "1px solid #d0d0d0",
                              borderRadius: "4px",
                              outline: "none",
                              background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                              cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                            }}
                          />
                        </td>
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
            onClick={() => router.push("/status-ga/smoke-detector")}
            style={{
              padding: "12px 28px",
              background: "#757575",
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
              disabled={!selectedDate || saving || !isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              style={{
                padding: "12px 28px",
                background: (selectedDate && !saving && isScanned) ? "linear-gradient(135deg, #1e88e5, #0d47a1)" : "#bdbdbd",
                color: (selectedDate && !saving && isScanned) ? "white" : "#9e9e9e",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: (selectedDate && !saving && isScanned) ? "pointer" : "not-allowed",
                opacity: (selectedDate && !saving && isScanned) ? 1 : 0.6
              }}
            >
              {saving ? "⏳ Menyimpan..." : "✓ Simpan Data"}
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
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>
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