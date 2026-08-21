// app/status-ga/smoke-detector/GaSmokeDetectorContent.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import QrScanner from 'qr-scanner';
import { ArrowLeft, Plus, Trash2, Edit2, X } from "lucide-react";
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
  detector_type?: string;
}

interface LocationGroup {
  locationName: string;
  zone: string;
  detectorType: string;
  areas: Area[];
}

// ✅ Detector Type Options
const DETECTOR_TYPES = [
  "SMOKE DETECTOR",
  "ROR HEAT DETECTOR",
  "FIXED TEMPERATUR HEAT DETECTOR"
] as const;

// ✅ Helper: Parse nama lokasi dari field name (hapus \\x07 dan bersihkan)
const parseLocationName = (fullName: string): string => {
  const parts = fullName.split('\\x07');
  return parts[0]?.trim() || fullName.trim();
};

// ✅ Helper: Parse zone dari field location
const parseZone = (location: string): string => {
  const match = location.match(/Zone\s*(\d+)/i);
  return match ? `Zone ${match[1]}` : location || '-';
};

// ✅ Helper: Detect detector type dari nama lokasi
const detectDetectorType = (name: string): string => {
  const upperName = name.toUpperCase();
  
  // FIXED TEMPERATUR HEAT DETECTOR
  if (['PANTRY', 'GENSET A', 'GENSET C', 'TRAFO', 'PANEL GENBA C', 'GENSET (POWER HOUSE B)'].some(loc => upperName.includes(loc))) {
    return 'FIXED TEMPERATUR HEAT DETECTOR';
  }
  
  // ROR HEAT DETECTOR
  if (['KORIDOR LOBBY', 'WAREHOUSE', 'HR', 'CNC ROOM', 'JIG PROTO OFFICE', 'GENBA C NEW', 'MAINTENANCE OFFICE', 'MEETING ROOM D', 'DINING ROOM', 'PUMP ROOM', 'COMPRESSOR', 'PANEL ROOM', 'CANTEEN', 'TOKO GABUS', 'KOPKAR', 'AUDITORIUM', 'POWER HOUSE B', 'RUANG CAPASITOR', 'RUANG COMPRESSOR', 'SCAN IN EXIM'].some(loc => upperName.includes(loc))) {
    return 'ROR HEAT DETECTOR';
  }
  
  // Default: SMOKE DETECTOR
  return 'SMOKE DETECTOR';
};

export function GaSmokeDetectorContent() {
  const router = useRouter();
  const { user, loading: authLoading, isInitialized } = useAuth();
  const { isOnline, pendingCount } = useConnection();

  // ✅ FIX: Use native URL API instead of useSearchParams hook to avoid conflicts
  const getQueryParam = (name: string): string => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get(name) || '';
  };

  const openAreaParam = getQueryParam('openArea');
  const TYPE_SLUG = 'smoke-detector';
  
  // ✅ State Management
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedLocationForOptions, setSelectedLocationForOptions] = useState<LocationGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDetectorType, setSelectedDetectorType] = useState("all");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [checksheetData, setChecksheetData] = useState<any | null>(null);
  const [selectedDateInModal, setSelectedDateInModal] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [areaStatuses, setAreaStatuses] = useState<Record<number, { statusLabel: string; statusColor: string; lastCheck: string }>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [currentPreviewImage, setCurrentPreviewImage] = useState("");
  
  // ✅ Edit Data States
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // ✅ Add Location Form State
  const [addFormData, setAddFormData] = useState({
    detector_type: 'SMOKE DETECTOR',
    name: '',
    location: ''
  });
  
  // ✅ NEW: State untuk location group di modal detail (untuk dropdown unit)
  const [currentLocationGroupInModal, setCurrentLocationGroupInModal] = useState<LocationGroup | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEditDropdown(false);
      }
    };
    if (showEditDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEditDropdown]);

  // Load inspection items
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

  // Load areas
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const data = await getAreasByType(TYPE_SLUG);
        const areasWithDetectorType: Area[] = data.map((area: any) => ({
          ...area,
          detector_type: area.detector_type || detectDetectorType(area.name)
        }));
        console.log('✅ Loaded areas:', areasWithDetectorType.length);
        setAreas(areasWithDetectorType);
      } catch (error) {
        console.error("Failed to load areas:", error);
      }
    };
    loadAreas();
  }, []);

  // Load status untuk semua area
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
              lastCheck: new Date(latest).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
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

  // Authentication verification
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

  // Auto-open modal jika ada openArea param
  useEffect(() => {
    if (!isMounted || !authVerified || !openAreaParam || areas.length === 0) return;
    const parsedParam = openAreaParam.trim().toUpperCase();
    const found = areas.find((item) => {
      const locationName = parseLocationName(item.name).toUpperCase();
      return locationName === parsedParam;
    });
    if (found) {
      setTimeout(() => openDetail(found), 300);
    }
  }, [isMounted, authVerified, openAreaParam, areas]);

  // ✅ Group areas by location name + zone + detector type
  const groupedLocations: LocationGroup[] = areas.reduce((acc: LocationGroup[], area) => {
    const locationName = parseLocationName(area.name);
    const zone = parseZone(area.location);
    const detectorType = area.detector_type || 'SMOKE DETECTOR';
    
    const existing = acc.find(g => g.locationName === locationName && g.zone === zone && g.detectorType === detectorType);
    if (existing) {
      existing.areas.push(area);
    } else {
      acc.push({ locationName, zone, detectorType, areas: [area] });
    }
    return acc;
  }, []);

  // ✅ Filter data berdasarkan search + detector type
  const filteredLocations = groupedLocations.filter(group => {
    const matchesSearch = group.locationName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedDetectorType === "all" || group.detectorType === selectedDetectorType;
    return matchesSearch && matchesType;
  });

  // ✅ Open detail dengan load data dari API + set location group
  const openDetail = async (area: Area) => {
    console.log('🔍 Opening detail for area:', area);
    
    // Cari location group untuk area ini
    const locationName = parseLocationName(area.name);
    const zone = parseZone(area.location);
    const detectorType = area.detector_type || 'SMOKE DETECTOR';
    
    const group = groupedLocations.find(g => 
      g.locationName === locationName && 
      g.zone === zone && 
      g.detectorType === detectorType
    );
    
    // Set location group untuk dropdown unit
    setCurrentLocationGroupInModal(group || null);
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);
    
    try {
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      console.log('📅 Available dates:', dates.length);
      setAvailableDates(dates);
      
      if (dates.length > 0) {
        const latestDate = dates[0];
        setSelectedDateInModal(latestDate);
        const data = await getChecklistByDate(TYPE_SLUG, area.id, latestDate);
        console.log('📦 Checklist data:', data);
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
      alert("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedArea(null);
    setCurrentLocationGroupInModal(null);
    setChecksheetData(null);
    setSelectedDateInModal("");
    setAvailableDates([]);
    setShowModal(false);
  };

  // ✅ NEW: Handle unit change dari dropdown di modal detail
  const handleUnitChangeInModal = (areaId: number) => {
    if (!currentLocationGroupInModal) return;
    
    const area = currentLocationGroupInModal.areas.find(a => a.id === areaId);
    if (area) {
      console.log('🔄 Switching to unit:', area.no);
      setSelectedArea(area);
      // Reload data untuk unit yang baru
      loadAreaData(area);
    }
  };

  // ✅ Load data untuk area yang dipilih
  const loadAreaData = async (area: Area) => {
    setIsLoading(true);
    try {
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      setAvailableDates(dates);
      
      if (dates.length > 0) {
        const latestDate = dates[0];
        setSelectedDateInModal(latestDate);
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
      alert("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Buka modal opsi lokasi dengan list unit spesifik
  const openOptionsModal = (locationGroup: LocationGroup) => {
    setSelectedLocationForOptions(locationGroup);
    setShowOptionsModal(true);
  };

  const closeOptionsModal = () => {
    setShowOptionsModal(false);
    setSelectedLocationForOptions(null);
  };

  // ✅ Redirect ke form dengan areaId spesifik
  const handleInspectOption = (areaId: number, locationName: string, unitNo: number) => {
    router.push(`/e-checksheet-smoke-detector?areaId=${areaId}&location=${encodeURIComponent(locationName)}&unit=${unitNo}`);
  };

  // ✅ Handle Add Location
  const handleAddLocation = async () => {
    if (!addFormData.name || !addFormData.location) {
      alert('Semua field wajib diisi!');
      return;
    }
    try {
      setIsAdding(true);
      
      const maxNo = areas.reduce((max, area) => Math.max(max, area.no), 0);
      const newNo = maxNo + 1;
      const newName = `${addFormData.name} \\x07 ${addFormData.location}`;
      
      const response = await smartFetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          no: newNo,
          name: newName,
          location: addFormData.location,
          detector_type: addFormData.detector_type,
          type_id: 8,
          is_active: true
        }),
        queueType: 'smoke_detector',
        metadata: { areaCode: TYPE_SLUG }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Gagal menyimpan data');
      }

      const newArea: Area = {
        id: result.data?.id || Date.now(),
        no: newNo,
        name: newName,
        location: addFormData.location,
        detector_type: addFormData.detector_type
      };

      setAreas(prev => [...prev, newArea]);
      alert('✅ Lokasi berhasil ditambahkan!');
      
      setAddFormData({ detector_type: 'SMOKE DETECTOR', name: '', location: '' });
      setShowAddModal(false);
      setShowEditDropdown(false);
      
    } catch (error) {
      console.error('❌ Error adding location:', error);
      alert('❌ Gagal menambahkan lokasi: ' + (error as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  // ✅ Handle Delete Location
  const handleDeleteLocation = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      
      const response = await smartFetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/areas/${deleteTarget.id}`, {
        method: 'DELETE',
        queueType: 'smoke_detector',
        metadata: { areaCode: TYPE_SLUG }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Gagal menghapus data');
      }

      setAreas(prev => prev.filter(area => area.id !== deleteTarget.id));
      alert('✅ Lokasi berhasil dihapus!');
      
      setIsDeleteMode(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setShowEditDropdown(false);
      
    } catch (error) {
      console.error('❌ Error deleting location:', error);
      alert('❌ Gagal menghapus lokasi: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Load data ketika tanggal berubah
  useEffect(() => {
    if (!selectedArea || !selectedDateInModal || !showModal || !authVerified) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getChecklistByDate(TYPE_SLUG, selectedArea.id, selectedDateInModal);
        setChecksheetData(data);
      } catch (error) {
        console.error("Error loading checklist:", error);
        setChecksheetData(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedDateInModal, selectedArea, showModal, authVerified]);

  // Fungsi buka modal gambar
  const openImageModal = (url: string) => { setCurrentImageUrl(url); setShowImageModal(true); };
  const closeImageModal = () => { setShowImageModal(false); setCurrentImageUrl(""); };
  const openImagePreviewModal = (imageUrl: string) => { setCurrentPreviewImage(imageUrl); setShowImagePreviewModal(true); };
  const closeImagePreviewModal = () => { setShowImagePreviewModal(false); setCurrentPreviewImage(""); };

  // QR Scanner functions
  const openQrScanner = () => { setIsScanning(true); };

  useEffect(() => {
    return () => { if (qrScannerRef.current) { qrScannerRef.current.destroy(); } };
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
          if (url.pathname === '/e-checksheet-smoke-detector') {
            router.push(urlStr);
            return;
          }
        }
        if (urlStr.startsWith('/e-checksheet-smoke-detector?')) {
          router.push(urlStr);
          return;
        }
        alert("Invalid QR code.");
      } catch (err) {
        alert("Invalid QR format.");
      }
    };
    const onScanError = (error: string | Error) => { console.warn("QR scan error:", error); };
    qrScannerRef.current = new QrScanner(video, onScanSuccess, onScanError);
    qrScannerRef.current.start();
    return () => { if (qrScannerRef.current) { qrScannerRef.current.stop(); } };
  }, [isScanning, router]);

  // Loading states
  if (!isMounted || !isInitialized || !authVerified) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666" }}>{authLoading ? "Loading authentication..." : "Verifying session..."}</p>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user?.fullName} />
      <div style={{ paddingLeft: "96px", paddingRight: "20px", paddingTop: "24px", paddingBottom: "24px", maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "28px" }} className="header">
          <button onClick={() => router.push("/status-ga")} className="btn-back" aria-label="Kembali ke halaman utama" style={{ background: "none", border: "none", color: "#1976d2", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginBottom: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <ArrowLeft size={18} /> Kembali
          </button>
          <div style={{ background: "#1976d2", borderRadius: "8px", padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>🚨 Smoke & Heat Detector Inspection</h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px", fontWeight: "400" }}>Bi-monthly inspection schedule and maintenance records</p>
          </div>
        </div>

        {/* ✅ Search + Filter + Edit Data Button (Dropdown) */}
        <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e0e0e0" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <input type="text" placeholder="Cari lokasi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: "10px 40px 10px 16px", border: "1px solid #1976d2", borderRadius: "6px", fontSize: "14px", color: "#333", width: "100%", outline: "none" }} />
            </div>

            {/* Detector Type Filter */}
            <select value={selectedDetectorType} onChange={(e) => setSelectedDetectorType(e.target.value)} style={{ padding: "10px 16px", border: "1px solid #1976d2", borderRadius: "6px", fontSize: "14px", color: "#333", outline: "none", background: "white", minWidth: "200px" }}>
              <option value="all">Semua Tipe</option>
              {DETECTOR_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* ✅ Edit Data Button (Dropdown dengan 2 OPSI) */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setShowEditDropdown(!showEditDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: isDeleteMode ? "#f44336" : "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  height: "42px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}
              >
                {isDeleteMode ? <X size={18} /> : <Edit2 size={18} />}
                {isDeleteMode ? "Batal Edit" : "Edit Data"}
              </button>
              
              {/* ✅ Dropdown Menu dengan 2 OPSI */}
              {showEditDropdown && (
                <>
                  {/* Overlay untuk klik di luar */}
                  <div
                    onClick={() => setShowEditDropdown(false)}
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 1500
                    }}
                  />
                  
                  {/* Dropdown Menu */}
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "8px",
                      background: "white",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      border: "1px solid #e0e0e0",
                      zIndex: 1600,
                      minWidth: "220px",
                      overflow: "hidden"
                    }}
                  >
                    {/* ✅ OPSI 1: Tambah Lokasi */}
                    <button
                      onClick={() => {
                        setShowAddModal(true);
                        setShowEditDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "white",
                        border: "none",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#424242",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                    >
                      <Plus size={18} color="#1976d2" />
                      <span>
                        <strong>Tambah Lokasi</strong>
                        <div style={{ fontSize: "11px", color: "#757575", marginTop: "2px" }}>Tambah area baru</div>
                      </span>
                    </button>
                    
                    {/* ✅ OPSI 2: Hapus Lokasi */}
                    <button
                      onClick={() => {
                        setIsDeleteMode(!isDeleteMode);
                        setShowEditDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: isDeleteMode ? "#ffebee" : "white",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: isDeleteMode ? "#c62828" : "#424242",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDeleteMode ? "#ffcdd2" : "#f5f5f5"}
                      onMouseLeave={(e) => e.currentTarget.style.background = isDeleteMode ? "#ffebee" : "white"}
                    >
                      <Trash2 size={18} color={isDeleteMode ? "#f44336" : "#757575"} />
                      <span>
                        <strong>{isDeleteMode ? "Mode Hapus Aktif" : "Hapus Lokasi"}</strong>
                        <div style={{ fontSize: "11px", color: "#757575", marginTop: "2px" }}>
                          {isDeleteMode ? "Klik trash untuk hapus" : "Aktifkan mode hapus"}
                        </div>
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Delete Mode Banner */}
          {isDeleteMode && (
            <div style={{
              marginTop: "12px",
              padding: "12px 16px",
              background: "#ffebee",
              border: "1px solid #f44336",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#c62828", fontWeight: "600", fontSize: "14px" }}>
                <Trash2 size={18} />
                Mode Hapus Aktif - Klik ikon sampah pada baris untuk menghapus
              </div>
              <button
                onClick={() => setIsDeleteMode(false)}
                style={{
                  padding: "6px 12px",
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                Selesai
              </button>
            </div>
          )}

          {/* Filter Summary */}
          {(selectedDetectorType !== "all" || searchTerm) && (
            <div style={{ marginTop: "12px", padding: "8px 12px", background: "#e3f2fd", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1565c0" }}>
              <span>📊 Menampilkan {filteredLocations.length} dari {groupedLocations.length} lokasi</span>
              {selectedDetectorType !== "all" && (
                <span style={{ padding: "2px 8px", background: "#1976d2", color: "white", borderRadius: "4px", fontSize: "11px" }}>{selectedDetectorType}</span>
              )}
            </div>
          )}
        </div>

        {/* Loading Status Indicator */}
        {isLoadingStatuses && (
          <div style={{ padding: "12px 20px", background: "#fff3cd", borderRadius: "6px", marginBottom: "16px", color: "#856404", fontSize: "13px", textAlign: "center" }}>⏳ Loading status data...</div>
        )}

        {/* Table */}
        <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden", border: "1px solid #e0e0e0" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "900px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Lokasi</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Zone</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Tipe</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Jumlah Unit</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                  {isDeleteMode && (
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#ffebee", fontWeight: "600", color: "#c62828", fontSize: "13px", width: "80px" }}>
                      🗑️ Hapus
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={isDeleteMode ? 8 : 7} style={{ padding: "40px 20px", textAlign: "center", color: "#999" }}>
                      {searchTerm || selectedDetectorType !== "all" ? "Tidak ada data yang sesuai dengan filter" : "Tidak ada data"}
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((group, idx) => {
                    const bestStatus = group.areas.reduce((best, area) => {
                      const status = areaStatuses[area.id] || { statusLabel: "No Data", statusColor: "#757575", lastCheck: "-" };
                      if (status.statusLabel === "Checked") return status;
                      if (status.statusLabel === "Error" && best.statusLabel !== "Checked") return status;
                      return best;
                    }, { statusLabel: "No Data", statusColor: "#757575", lastCheck: "-" });

                    return (
                      <tr key={`${group.locationName}-${group.zone}-${group.detectorType}`} style={{ borderBottom: idx === filteredLocations.length - 1 ? "none" : "1px solid #f0f0f0", background: isDeleteMode ? "#fff5f5" : "white" }}>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{idx + 1}</td>
                        <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{group.locationName}</td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>{group.zone}</td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <span style={{ padding: "4px 8px", background: group.detectorType === "SMOKE DETECTOR" ? "#e3f2fd" : group.detectorType === "ROR HEAT DETECTOR" ? "#fff3e0" : "#fce4ec", color: group.detectorType === "SMOKE DETECTOR" ? "#0d47a1" : group.detectorType === "ROR HEAT DETECTOR" ? "#e65100" : "#880e4f", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>{group.detectorType}</span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>
                          <span style={{ padding: "4px 12px", background: "#e3f2fd", color: "#0d47a1", borderRadius: "12px", fontSize: "11px", fontWeight: "600" }}>{group.areas.length} unit</span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <span style={{ padding: "4px 12px", background: bestStatus.statusColor, color: "white", borderRadius: "12px", fontSize: "11px", fontWeight: "600", display: "inline-block" }}>{bestStatus.statusLabel}</span>
                            <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{bestStatus.lastCheck}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button onClick={() => openDetail(group.areas[0])} disabled={isDeleteMode} style={{ padding: "7px 14px", borderRadius: "5px", fontSize: "13px", fontWeight: "500", background: isDeleteMode ? "#bdbdbd" : "#1976d2", color: "white", border: "none", cursor: isDeleteMode ? "not-allowed" : "pointer" }}>View</button>
                            <button onClick={() => openOptionsModal(group)} disabled={isDeleteMode} style={{ padding: "7px 14px", borderRadius: "5px", fontSize: "13px", fontWeight: "500", background: isDeleteMode ? "#bdbdbd" : "#43a047", color: "white", border: "none", cursor: isDeleteMode ? "not-allowed" : "pointer" }}>Inspect</button>
                          </div>
                        </td>
                        {isDeleteMode && (
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <button
                              onClick={() => {
                                setDeleteTarget({ id: group.areas[0].id, name: group.locationName });
                                setShowDeleteConfirm(true);
                              }}
                              style={{
                                padding: "8px 12px",
                                background: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto"
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ MODAL OPSI LOKASI - Menampilkan semua unit dalam group */}
        {showOptionsModal && selectedLocationForOptions && (
          <div onClick={closeOptionsModal} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1500, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", width: "95%", maxWidth: "600px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", color: "#212121", fontSize: "18px", fontWeight: "600" }}>📍 {selectedLocationForOptions.locationName}</h3>
                  <p style={{ margin: 0, color: "#757575", fontSize: "13px" }}>{selectedLocationForOptions.zone} • {selectedLocationForOptions.detectorType} • {selectedLocationForOptions.areas.length} unit tersedia</p>
                </div>
                <button onClick={closeOptionsModal} style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "#757575", padding: "0", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
              <div style={{ padding: "16px 24px", maxHeight: "400px", overflowY: "auto" }}>
                {selectedLocationForOptions.areas.map((area, idx) => {
                  const status = areaStatuses[area.id] || { statusLabel: "No Data", statusColor: "#757575", lastCheck: "-" };
                  return (
                    <div key={area.id} style={{ padding: "12px", border: "1px solid #e0e0e0", borderRadius: "8px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "600", color: "#212121", marginBottom: "4px" }}>
                          {selectedLocationForOptions!.locationName} ({area.no})
                        </div>
                        <div style={{ fontSize: "12px", color: "#757575" }}>
                          <span style={{ padding: "2px 8px", background: status.statusColor, color: "white", borderRadius: "4px", fontSize: "10px", fontWeight: "600", marginRight: "8px" }}>{status.statusLabel}</span>
                          {status.lastCheck}
                        </div>
                      </div>
                      <button onClick={() => handleInspectOption(area.id, selectedLocationForOptions!.locationName, area.no)} style={{ padding: "8px 16px", background: "#43a047", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: "pointer", fontSize: "13px" }}>Inspect</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ✅ Modal Tambah Lokasi dengan Dropdown Tipe Detector */}
        {showAddModal && (
          <div
            onClick={() => setShowAddModal(false)}
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
              zIndex: 2000,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                overflow: "hidden"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                background: "#1976d2",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <h2 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: "600" }}>
                  📍 Tambah Lokasi Baru
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "white",
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

              <div style={{ padding: "24px" }}>
                {/* ✅ Dropdown Tipe Detector */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    Tipe Detector <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <select
                    value={addFormData.detector_type}
                    onChange={(e) => setAddFormData({ ...addFormData, detector_type: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#333",
                      outline: "none",
                      background: "white"
                    }}
                  >
                    {DETECTOR_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Nama Lokasi */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    Nama Lokasi <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    placeholder="Contoh: LOBBY, CANTEEN, dll"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#333",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Zone */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    Zone <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.location}
                    onChange={(e) => setAddFormData({ ...addFormData, location: e.target.value })}
                    placeholder="Contoh: Zone 1"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#333",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                padding: "16px 24px",
                background: "#f5f5f5",
                borderTop: "1px solid #e0e0e0"
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isAdding}
                  style={{
                    padding: "10px 20px",
                    background: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "500",
                    cursor: isAdding ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAddLocation}
                  disabled={isAdding}
                  style={{
                    padding: "10px 20px",
                    background: isAdding ? "#bdbdbd" : "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "500",
                    cursor: isAdding ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  {isAdding ? "⏳ Menyimpan..." : "💾 Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Modal Konfirmasi Hapus */}
        {showDeleteConfirm && (
          <div
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeleteTarget(null);
            }}
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
              zIndex: 2500,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "400px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                overflow: "hidden"
              }}
            >
              <div style={{
                padding: "20px 24px",
                background: "#f44336",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <h2 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: "600" }}>
                  ⚠️ Konfirmasi Hapus
                </h2>
              </div>

              <div style={{ padding: "24px" }}>
                <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#424242" }}>
                  Apakah Anda yakin ingin menghapus lokasi ini?
                </p>
                <div style={{
                  padding: "12px",
                  background: "#ffebee",
                  borderRadius: "6px",
                  marginBottom: "16px"
                }}>
                  <strong style={{ color: "#c62828" }}>{deleteTarget?.name}</strong>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#757575" }}>
                  ⚠️ Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                padding: "16px 24px",
                background: "#f5f5f5",
                borderTop: "1px solid #e0e0e0"
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                  }}
                  disabled={isDeleting}
                  style={{
                    padding: "10px 20px",
                    background: "#757575",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "500",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLocation}
                  disabled={isDeleting}
                  style={{
                    padding: "10px 20px",
                    background: isDeleting ? "#bdbdbd" : "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "500",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontSize: "14px"
                  }}
                >
                  {isDeleting ? "⏳ Menghapus..." : "🗑️ Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Modal Detail - DENGAN DROPDOWN UNIT */}
        {showModal && selectedArea && (
          <div onClick={closeDetail} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "8px", width: "95%", maxWidth: "1400px", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: "#f5f5f5", borderBottom: "1px solid #e0e0e0" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", color: "#212121", fontSize: "20px", fontWeight: "600" }}>Inspection History - {currentLocationGroupInModal?.locationName || parseLocationName(selectedArea.name)}</h2>
                  <p style={{ margin: "0", color: "#616161", fontSize: "14px" }}>Unit #{selectedArea.no} • {parseZone(selectedArea.location)}</p>
                </div>
                <button onClick={closeDetail} style={{ background: "transparent", border: "none", fontSize: "28px", cursor: "pointer", color: "#757575", padding: "0", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
              
              {/* ✅ DROPDOWN UNIT - BARU DITAMBAHKAN */}
              {currentLocationGroupInModal && currentLocationGroupInModal.areas.length > 1 && (
                <div style={{ padding: "16px 24px", background: "#e3f2fd", borderBottom: "1px solid #bbdefb" }}>
                  <label style={{ fontWeight: "600", color: "#1976d2", marginRight: "12px", fontSize: "14px" }}>📍 Pilih Unit:</label>
                  <select
                    value={selectedArea?.id || ""}
                    onChange={(e) => handleUnitChangeInModal(parseInt(e.target.value))}
                    style={{
                      color: "#212121",
                      padding: "8px 16px",
                      border: "2px solid #1976d2",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: "600",
                      minWidth: "250px",
                      outline: "none",
                      cursor: "pointer",
                      background: "white"
                    }}
                  >
                    {currentLocationGroupInModal.areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {currentLocationGroupInModal.locationName} (Unit {area.no})
                      </option>
                    ))}
                  </select>
                  <span style={{ marginLeft: "16px", color: "#1976d2", fontSize: "13px", fontWeight: "500" }}>
                    Total: {currentLocationGroupInModal.areas.length} unit
                  </span>
                </div>
              )}
              
              <div style={{ padding: "16px 24px", background: "white", borderBottom: "1px solid #e0e0e0" }}>
                <label style={{ fontWeight: "500", color: "#424242", marginRight: "12px", fontSize: "14px" }}>Inspection Date:</label>
                <select value={selectedDateInModal} onChange={(e) => setSelectedDateInModal(e.target.value)} disabled={availableDates.length === 0} style={{ color: "#212121", padding: "7px 12px", border: "1px solid #d0d0d0", borderRadius: "5px", fontSize: "14px", fontWeight: "500", minWidth: "160px", outline: "none", cursor: availableDates.length > 0 ? "pointer" : "not-allowed" }}>
                  {availableDates.length === 0 ? (<option value="">No data available</option>) : (<><option value="">-- Select Date --</option>{availableDates.map(date => (<option key={date} value={date}>{new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</option>))}</>)}
                </select>
              </div>
              <div style={{ padding: "24px", overflowY: "auto", flex: 1, background: "#fafafa" }}>
                {!selectedDateInModal ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#757575" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📅</div>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>{availableDates.length === 0 ? "📭 No inspection data available for this unit" : "👆 Please select an inspection date"}</p>
                  </div>
                ) : isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>⏳ Loading data...</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    {(() => {
                      if (!checksheetData) {
                        return (<div style={{ textAlign: "center", padding: "40px", color: "#9e9e9e" }}>❌ No data found for this date</div>);
                      }
                      const inspectionItemsList = [{ key: "alarm_bell", label: "Alarm Bell" }, { key: "indicator_lamp", label: "Indicator Lamp" }, { key: "cleanliness", label: "Cleanliness" }, { key: "overall_condition", label: "Overall Condition" }];
                      return (
                        <div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1400px", border: "1px solid #e0e0e0", background: "white" }}>
                            <thead>
                              <tr style={{ background: "#f5f5f5" }}>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "50px" }}>No</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", minWidth: "250px" }}>ITEM</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "100px" }}>HASIL</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "180px" }}>KETERANGAN N-OK</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "200px" }}>DOKUMENTASI</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "80px" }}>PIC</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "100px" }}>DUE DATE</th>
                                <th style={{ padding: "10px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "80px" }}>VERIFY</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inspectionItemsList.map((item, index) => {
                                const entry = checksheetData[item.key];
                                const value = entry?.hasilPemeriksaan || "-";
                                const images = entry?.images || [];
                                return (
                                  <tr key={item.key}>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4" }}>{item.label}</td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontWeight: "700", background: value === "OK" ? "#e8f5e9" : value === "NG" ? "#ffebee" : "#fff", color: value === "OK" ? "#2e7d32" : value === "NG" ? "#c62828" : "#757575", fontSize: "11px" }}>{value === "OK" ? "✓ OK" : value === "NG" ? "✗ NG" : "-"}</td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4", fontSize: "11px" }}>{entry?.keteranganTemuan || "-"}</td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", verticalAlign: "top" }}>
                                      {images.length > 0 ? (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", maxHeight: "100px", overflowY: "auto" }}>
                                          {images.map((imgUrl: string, imgIdx: number) => (
                                            <div key={imgIdx} style={{ position: "relative", width: "60px", height: "60px", overflow: "hidden", borderRadius: "4px", border: "1px solid #ddd", cursor: "pointer" }} onClick={() => openImagePreviewModal(imgUrl)}>
                                              <img src={imgUrl} alt={`Dok ${index + 1}-${imgIdx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                              <div style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.6)", color: "white", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>{imgIdx + 1}</div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div style={{ textAlign: "center", color: "#9e9e9e", fontSize: "11px", padding: "8px 0" }}>-</div>
                                      )}
                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4", fontSize: "11px" }}>{entry?.tindakanPerbaikan || "-"}</td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>{entry?.pic || "-"}</td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>{entry?.dueDate ? new Date(entry.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "-"}</td>
                                    <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>{entry?.verify || "-"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {showImagePreviewModal && (
                            <div onClick={closeImagePreviewModal} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000, padding: "20px" }}>
                              <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                                <img src={currentPreviewImage} alt="Preview Dokumentasi" style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: "8px", border: "3px solid white", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }} />
                                <div style={{ marginTop: "16px", color: "white", fontSize: "14px", fontWeight: "500" }}>Click outside to close</div>
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: "20px", padding: "12px", background: "#f9f9f9", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                            <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#757575" }}>Inspector</p>
                            <p style={{ margin: "0", fontSize: "13px", fontWeight: "500", color: "#424242" }}>{checksheetData.alarm_bell?.inspector || "N/A"}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div style={{ padding: "16px 24px", background: "#f5f5f5", borderTop: "1px solid #e0e0e0", textAlign: "right" }}>
                <button onClick={closeDetail} style={{ padding: "9px 20px", background: "#757575", color: "white", border: "none", borderRadius: "5px", fontWeight: "500", cursor: "pointer", fontSize: "14px" }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {isScanning && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }} onClick={() => { setIsScanning(false); if (qrScannerRef.current) { qrScannerRef.current.destroy(); qrScannerRef.current = null; } }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "8px", padding: "16px", textAlign: "center", maxWidth: "90vw", width: "100%" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>Scan Smoke Detector QR Code</h3>
              <video ref={videoRef} style={{ width: "100%", maxHeight: "60vh", borderRadius: "6px", background: "#000" }} />
              <p style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>Point your camera at the QR code on the detector</p>
              <button onClick={() => { setIsScanning(false); if (qrScannerRef.current) { qrScannerRef.current.destroy(); qrScannerRef.current = null; } }} style={{ marginTop: "16px", padding: "8px 20px", background: "#757575", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Modal Popup Gambar Dokumentasi */}
        {showImageModal && (
          <div onClick={closeImageModal} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
              <img src={currentImageUrl} alt="Dokumentasi" style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: "8px", border: "3px solid white" }} />
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>Click outside to close</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}