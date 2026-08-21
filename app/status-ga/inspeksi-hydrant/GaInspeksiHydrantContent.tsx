// app/status-ga/inspeksi-hydrant/GaInspeksiHydrantContent.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import QrScanner from 'qr-scanner';
import { ArrowLeft, Edit2, Plus, Trash2, X } from "lucide-react";
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

// ✅ FIXED: Parse area sesuai format DB yang sebenarnya
// Format DB: "HYDRANT INDOOR 1 \x07 LANTAI 1" → name=parts[0], lokasiDetail=parts[1], zona=area.location
// Format DB PILLAR: "HYDRANT PILLAR 1" (tanpa \x07) → name=area.name, lokasiDetail="", zona=area.location
const parseAreaName = (area: Area) => {
  const parts = area.name.split('\x07');
  const namaHydrant = parts[0]?.trim() || area.name;
  const lokasiDetail = parts[1]?.trim() || '';
  const zona = area.location || '';

  // Deteksi jenis hydrant dari nama
  let jenisHydrant = 'HYDRANT INDOOR';
  if (namaHydrant.includes('HYDRANT PILLAR')) jenisHydrant = 'HYDRANT PILLAR';
  else if (namaHydrant.includes('HYDRANT OUTDOOR')) jenisHydrant = 'HYDRANT OUTDOOR';
  else if (namaHydrant.includes('HYDRANT INDOOR')) jenisHydrant = 'HYDRANT INDOOR';

  return { namaHydrant, lokasiDetail, zona, jenisHydrant };
};

export function GaInspeksiHydrantContent() {
  const router = useRouter();
  const { user, loading: authLoading, isInitialized } = useAuth();
  const TYPE_SLUG = 'inspeksi-hydrant';
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // ✅ FIXED: Default category sesuai data DB yang paling banyak
  const [selectedCategory, setSelectedCategory] = useState("HYDRANT INDOOR");
  const [searchTerm, setSearchTerm] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [currentPreviewImage, setCurrentPreviewImage] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [checksheetData, setChecksheetData] = useState<any | null>(null);
  const [selectedDateInModal, setSelectedDateInModal] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [areaStatuses, setAreaStatuses] = useState<Record<number, { statusLabel: string; statusColor: string; lastCheck: string }>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  // Edit Data States
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // ✅ FIXED: Form tambah lokasi disesuaikan dengan format DB (nama + lokasiDetail + zona)
  const [addFormData, setAddFormData] = useState({
    namaHydrant: '',   // mis: HYDRANT INDOOR 37
    lokasiDetail: '',  // mis: RUANG GENSET (bagian setelah \x07)
    zona: '',          // mis: TIMUR (disimpan di kolom location)
    jenisHydrant: 'HYDRANT INDOOR'
  });

  // Close dropdown ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEditDropdown(false);
      }
    };
    if (showEditDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEditDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
      }
    };
    if (showAddModal) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddModal]);

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
        console.log('✅ Loaded areas:', data.length);
        setAreas(data);
      } catch (error) {
        console.error("Failed to load areas:", error);
      }
    };
    loadAreas();
  }, []);

  // Load status semua area
  useEffect(() => {
    if (areas.length === 0 || isLoadingStatuses || !authVerified) return;
    const loadAllStatuses = async () => {
      setIsLoadingStatuses(true);
      const statusMap: Record<number, { statusLabel: string; statusColor: string; lastCheck: string }> = {};
      for (const area of areas) {
        try {
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          if (dates.length > 0) {
            statusMap[area.id] = {
              statusLabel: "Checked",
              statusColor: "#43a047",
              lastCheck: new Date(dates[0]).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
            };
          } else {
            statusMap[area.id] = { statusLabel: "No Data", statusColor: "#757575", lastCheck: "-" };
          }
        } catch {
          statusMap[area.id] = { statusLabel: "Error", statusColor: "#f44336", lastCheck: "-" };
        }
      }
      setAreaStatuses(statusMap);
      setIsLoadingStatuses(false);
    };
    loadAllStatuses();
  }, [areas, authVerified]);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted || !isInitialized || authLoading) { setAuthVerified(false); return; }
    if (user && isAuthorizedForChecksheet(user)) { setAuthVerified(true); return; }
    const t = setTimeout(() => {
      if (!user || !isAuthorizedForChecksheet(user)) router.push("/login-page");
      else setAuthVerified(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [user, authLoading, isInitialized, router, isMounted]);

  // ✅ FIXED: handleAddLocation sesuai format DB
  const handleAddLocation = async () => {
    if (!addFormData.namaHydrant || !addFormData.zona) {
      alert('Nama hydrant dan zona wajib diisi!');
      return;
    }
    try {
      setIsAdding(true);
      const maxNo = areas.reduce((max, area) => Math.max(max, area.no), 0);
      const newNo = maxNo + 1;

      // Format sesuai DB: "HYDRANT INDOOR 37 \x07 RUANG GENSET" (lokasiDetail opsional)
      const newName = addFormData.lokasiDetail
        ? `${addFormData.namaHydrant.toUpperCase()} \x07 ${addFormData.lokasiDetail.toUpperCase()}`
        : addFormData.namaHydrant.toUpperCase();

      const response = await smartFetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          no: newNo,
          name: newName,
          location: addFormData.zona.toUpperCase(), // zona disimpan di kolom location
          type_id: 4,
          is_active: true
        }),
        queueType: 'inspeksi_hydrant',
        metadata: { areaCode: 'hydrant' }
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Gagal menyimpan data');

      setAreas(prev => [...prev, {
        id: result.data?.id || Date.now(),
        no: newNo,
        name: newName,
        location: addFormData.zona.toUpperCase()
      }]);
      alert('✅ Lokasi berhasil ditambahkan!');
      setAddFormData({ namaHydrant: '', lokasiDetail: '', zona: '', jenisHydrant: 'HYDRANT INDOOR' });
      setShowAddModal(false);
      setShowEditDropdown(false);
    } catch (error) {
      alert('❌ Gagal menambahkan lokasi: ' + (error as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const response = await smartFetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/areas/${deleteTarget.id}`, { 
        method: 'DELETE',
        queueType: 'inspeksi_hydrant',
        metadata: { areaCode: 'hydrant' }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Gagal menghapus data');
      setAreas(prev => prev.filter(area => area.id !== deleteTarget.id));
      alert('✅ Lokasi berhasil dihapus!');
      setIsDeleteMode(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      alert('❌ Gagal menghapus lokasi: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDetail = async (area: Area) => {
    if (isDeleteMode) return;
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);
    try {
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDateInModal(dates[0]);
        const data = await getChecklistByDate(TYPE_SLUG, area.id, dates[0]);
        setChecksheetData(data);
      } else {
        setChecksheetData(null);
        setSelectedDateInModal("");
      }
    } catch {
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
    setChecksheetData(null);
    setSelectedDateInModal("");
    setAvailableDates([]);
    setShowModal(false);
  };

  // Load data ketika tanggal berubah di modal
  useEffect(() => {
    if (!selectedArea || !selectedDateInModal || !showModal || !authVerified) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await getChecklistByDate(TYPE_SLUG, selectedArea.id, selectedDateInModal);
        setChecksheetData(data);
      } catch {
        setChecksheetData(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedDateInModal, selectedArea, showModal, authVerified]);

  // ✅ FIXED: Filter sesuai format DB yang sebenarnya
  const filteredData = areas.filter(item => {
    const { namaHydrant, lokasiDetail, zona, jenisHydrant } = parseAreaName(item);
    const matchCategory = jenisHydrant === selectedCategory;
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      namaHydrant.toLowerCase().includes(q) ||
      lokasiDetail.toLowerCase().includes(q) ||
      zona.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  const openImageModal = (url: string) => { setCurrentImageUrl(url); setShowImageModal(true); };
  const closeImageModal = () => { setShowImageModal(false); setCurrentImageUrl(""); };
  const openImagePreviewModal = (url: string) => { setCurrentPreviewImage(url); setShowImagePreviewModal(true); };
  const closeImagePreviewModal = () => { setShowImagePreviewModal(false); setCurrentPreviewImage(""); };
  const openQrScanner = () => setIsScanning(true);

  useEffect(() => {
    return () => { if (qrScannerRef.current) qrScannerRef.current.destroy(); };
  }, []);

  useEffect(() => {
    if (!isScanning || !videoRef.current) return;
    const video = videoRef.current;
    const onScanSuccess = (result: string) => {
      setIsScanning(false);
      if (qrScannerRef.current) { qrScannerRef.current.destroy(); qrScannerRef.current = null; }
      try {
        let urlStr = result.trim();
        if (urlStr.startsWith('http')) {
          const url = new URL(urlStr);
          if (url.pathname === '/e-checksheet-hydrant') { router.push(urlStr); return; }
        }
        if (urlStr.startsWith('/e-checksheet-hydrant?')) { router.push(urlStr); return; }
        alert("Invalid QR code. Please scan a valid hydrant inspection QR.");
      } catch { alert("Invalid QR format."); }
    };
    qrScannerRef.current = new QrScanner(video, onScanSuccess, (e: string | Error) => console.warn("QR scan error:", e));
    qrScannerRef.current.start();
    return () => { if (qrScannerRef.current) qrScannerRef.current.stop(); };
  }, [isScanning, router]);

  if (!isMounted || !isInitialized || !authVerified) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666", margin: "0" }}>{authLoading ? "Loading authentication..." : "Verifying session..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user?.fullName} />
      <div style={{ paddingLeft: "96px", paddingRight: "20px", paddingTop: "24px", paddingBottom: "24px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <button
            onClick={() => router.push("/status-ga")}
            style={{ background: "none", border: "none", color: "#1976d2", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginBottom: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          <div style={{ background: "#1976d2", borderRadius: "8px", padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600" }}>🚒 Inspeksi Hydrant Dashboard</h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px" }}>Monthly inspection schedule and maintenance records</p>
          </div>
        </div>

        {/* Search Bar + Category + Edit Data */}
        <div style={{ background: "white", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e0e0e0" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #1e88e5", borderRadius: "6px", fontSize: "13px", fontWeight: "600", color: "#0d47a1", background: "white", cursor: "pointer", minWidth: "160px", flex: "0 0 auto", height: "42px" }}
            >
              <option value="HYDRANT INDOOR">HYDRANT INDOOR</option>
              <option value="HYDRANT PILLAR">HYDRANT PILLAR</option>
              <option value="HYDRANT OUTDOOR">HYDRANT OUTDOOR</option>
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Cari nama hydrant, lokasi, atau zona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: "200px", padding: "10px 16px", border: "1px solid #1976d2", borderRadius: "6px", fontSize: "14px", color: "#333", outline: "none", height: "42px" }}
            />

            {/* Edit Data Dropdown */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setShowEditDropdown(!showEditDropdown)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: isDeleteMode ? "#f44336" : "#4caf50", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "14px", height: "42px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
              >
                {isDeleteMode ? <X size={18} /> : <Edit2 size={18} />}
                {isDeleteMode ? "Batal Edit" : "Edit Data"}
              </button>
              {showEditDropdown && (
                <>
                  <div onClick={() => setShowEditDropdown(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1500 }} />
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "white", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: "1px solid #e0e0e0", zIndex: 1600, minWidth: "220px", overflow: "hidden" }}>
                    <button
                      onClick={() => { setShowAddModal(true); setShowEditDropdown(false); }}
                      style={{ width: "100%", padding: "12px 16px", background: "white", border: "none", borderBottom: "1px solid #f0f0f0", textAlign: "left", fontSize: "14px", color: "#424242", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                    >
                      <Plus size={18} color="#1976d2" />
                      <span><strong>Tambah Lokasi</strong><div style={{ fontSize: "11px", color: "#757575", marginTop: "2px" }}>Tambah area hydrant baru</div></span>
                    </button>
                    <button
                      onClick={() => { setIsDeleteMode(!isDeleteMode); setShowEditDropdown(false); }}
                      style={{ width: "100%", padding: "12px 16px", background: isDeleteMode ? "#ffebee" : "white", border: "none", textAlign: "left", fontSize: "14px", color: isDeleteMode ? "#c62828" : "#424242", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isDeleteMode ? "#ffcdd2" : "#f5f5f5"}
                      onMouseLeave={(e) => e.currentTarget.style.background = isDeleteMode ? "#ffebee" : "white"}
                    >
                      <Trash2 size={18} color={isDeleteMode ? "#f44336" : "#757575"} />
                      <span><strong>{isDeleteMode ? "Mode Hapus Aktif" : "Hapus Lokasi"}</strong><div style={{ fontSize: "11px", color: "#757575", marginTop: "2px" }}>{isDeleteMode ? "Klik trash untuk hapus" : "Aktifkan mode hapus"}</div></span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Delete Mode Banner */}
          {isDeleteMode && (
            <div style={{ marginTop: "12px", padding: "12px 16px", background: "#ffebee", border: "1px solid #f44336", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#c62828", fontWeight: "600", fontSize: "14px" }}>
                <Trash2 size={18} /> Mode Hapus Aktif - Klik ikon sampah pada baris untuk menghapus
              </div>
              <button onClick={() => setIsDeleteMode(false)} style={{ padding: "6px 12px", background: "#f44336", color: "white", border: "none", borderRadius: "4px", fontWeight: "500", cursor: "pointer", fontSize: "13px" }}>Selesai</button>
            </div>
          )}
        </div>

        {/* Status count */}
        <div style={{ marginBottom: "12px", fontSize: "13px", color: "#666" }}>
          Menampilkan <strong>{filteredData.length}</strong> dari <strong>{areas.filter(a => parseAreaName(a).jenisHydrant === selectedCategory).length}</strong> area {selectedCategory.toLowerCase()}
        </div>

        {/* Loading Status Indicator */}
        {isLoadingStatuses && (
          <div style={{ padding: "12px 20px", background: "#fff3cd", borderRadius: "6px", marginBottom: "16px", color: "#856404", fontSize: "13px", textAlign: "center" }}>
            ⏳ Loading status data...
          </div>
        )}

        {/* Table */}
        <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden", border: "1px solid #e0e0e0" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Nama Hydrant</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Lokasi Detail</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Zona</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                  {isDeleteMode && (
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#ffebee", fontWeight: "600", color: "#c62828", fontSize: "13px", width: "80px" }}>🗑️ Hapus</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={isDeleteMode ? 7 : 6} style={{ padding: "40px 20px", textAlign: "center", color: "#999" }}>
                      {areas.length === 0 ? "⏳ Memuat data..." : searchTerm ? "Tidak ada data yang sesuai dengan pencarian" : `Tidak ada data ${selectedCategory}`}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((area, idx) => {
                    // ✅ FIXED: Gunakan parseAreaName helper
                    const { namaHydrant, lokasiDetail, zona } = parseAreaName(area);
                    const status = areaStatuses[area.id] || { statusLabel: "Loading...", statusColor: "#757575", lastCheck: "-" };

                    return (
                      <tr key={area.id} style={{ borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0", background: isDeleteMode ? "#fff5f5" : "white" }}>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
                        <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{namaHydrant}</td>
                        <td style={{ padding: "14px 16px", color: "#666" }}>{lokasiDetail || "-"}</td>
                        <td style={{ padding: "14px 16px", color: "#666" }}>
                          <span style={{ padding: "3px 8px", background: "#e3f2fd", color: "#0d47a1", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
                            {zona || "-"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <span style={{ padding: "4px 12px", background: status.statusColor, color: "white", borderRadius: "12px", fontSize: "11px", fontWeight: "600", display: "inline-block" }}>{status.statusLabel}</span>
                            <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{status.lastCheck}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => openDetail(area)}
                              disabled={isDeleteMode}
                              style={{ padding: "7px 14px", borderRadius: "5px", fontSize: "13px", fontWeight: "500", background: isDeleteMode ? "#bdbdbd" : "#1976d2", color: "white", border: "none", cursor: isDeleteMode ? "not-allowed" : "pointer" }}
                            >
                              View
                            </button>
                            {/* ✅ FIXED: URL inspect pakai area.no untuk lookup, plus nama & zona sebagai info */}
                            <a
                              href={`/e-checksheet-ga/e-checksheet-hydrant?no=${area.no}&nama=${encodeURIComponent(namaHydrant)}&lokasi=${encodeURIComponent(lokasiDetail)}&zona=${encodeURIComponent(zona)}`}
                              style={{ padding: "7px 14px", borderRadius: "5px", fontSize: "13px", fontWeight: "500", background: isDeleteMode ? "#bdbdbd" : "#43a047", color: "white", textDecoration: "none", display: "inline-block", pointerEvents: isDeleteMode ? "none" : "auto" }}
                            >
                              Inspect
                            </a>
                          </div>
                        </td>
                        {isDeleteMode && (
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <button
                              onClick={() => { setDeleteTarget({ id: area.id, name: namaHydrant }); setShowDeleteConfirm(true); }}
                              style={{ padding: "8px 12px", background: "#f44336", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}
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

        {/* Modal Tambah Lokasi */}
        {showAddModal && (
          <div onClick={() => setShowAddModal(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
            <div ref={editModalRef} onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "500px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: "#1976d2" }}>
                <h2 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: "600" }}>📍 Tambah Lokasi Hydrant Baru</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "white", padding: "0" }}>×</button>
              </div>
              <div style={{ padding: "24px" }}>
                {/* Nama Hydrant */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>Nama Hydrant <span style={{ color: "#f44336" }}>*</span></label>
                  <input
                    type="text"
                    value={addFormData.namaHydrant}
                    onChange={(e) => setAddFormData({ ...addFormData, namaHydrant: e.target.value })}
                    placeholder="Contoh: HYDRANT INDOOR 37"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0d0d0", borderRadius: "6px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {/* Lokasi Detail */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>Lokasi Detail <span style={{ color: "#757575", fontWeight: "400" }}>(opsional)</span></label>
                  <input
                    type="text"
                    value={addFormData.lokasiDetail}
                    onChange={(e) => setAddFormData({ ...addFormData, lokasiDetail: e.target.value })}
                    placeholder="Contoh: LANTAI 2, RUANG SERVER, dll"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0d0d0", borderRadius: "6px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {/* Zona */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>Zona <span style={{ color: "#f44336" }}>*</span></label>
                  <select
                    value={addFormData.zona}
                    onChange={(e) => setAddFormData({ ...addFormData, zona: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0d0d0", borderRadius: "6px", fontSize: "14px", outline: "none", background: "white" }}
                  >
                    <option value="">— Pilih Zona —</option>
                    <option value="TIMUR">TIMUR</option>
                    <option value="BARAT">BARAT</option>
                    <option value="UTARA">UTARA</option>
                    <option value="SELATAN">SELATAN</option>
                    <option value="AREA PARKIR DEPAN">AREA PARKIR DEPAN</option>
                    <option value="AREA PARKIR BELAKANG">AREA PARKIR BELAKANG</option>
                    <option value="JALAN UTAMA TIMUR">JALAN UTAMA TIMUR</option>
                    <option value="JALAN UTAMA BARAT">JALAN UTAMA BARAT</option>
                    <option value="AREA LOADING DOCK">AREA LOADING DOCK</option>
                    <option value="AREA GUDANG">AREA GUDANG</option>
                    <option value="AREA PRODUKSI">AREA PRODUKSI</option>
                    <option value="AREA PERIMETER">AREA PERIMETER</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", padding: "16px 24px", background: "#f5f5f5", borderTop: "1px solid #e0e0e0" }}>
                <button onClick={() => setShowAddModal(false)} disabled={isAdding} style={{ padding: "10px 20px", background: "#757575", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: isAdding ? "not-allowed" : "pointer", fontSize: "14px" }}>Batal</button>
                <button onClick={handleAddLocation} disabled={isAdding} style={{ padding: "10px 20px", background: isAdding ? "#bdbdbd" : "#1976d2", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: isAdding ? "not-allowed" : "pointer", fontSize: "14px" }}>
                  {isAdding ? "⏳ Menyimpan..." : "💾 Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {showDeleteConfirm && (
          <div onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2500, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", background: "#f44336" }}>
                <h2 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: "600" }}>⚠️ Konfirmasi Hapus</h2>
              </div>
              <div style={{ padding: "24px" }}>
                <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#424242" }}>Apakah Anda yakin ingin menghapus lokasi ini?</p>
                <div style={{ padding: "12px", background: "#ffebee", borderRadius: "6px", marginBottom: "16px" }}>
                  <strong style={{ color: "#c62828" }}>{deleteTarget?.name}</strong>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#757575" }}>⚠️ Tindakan ini tidak dapat dibatalkan.</p>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", padding: "16px 24px", background: "#f5f5f5", borderTop: "1px solid #e0e0e0" }}>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} disabled={isDeleting} style={{ padding: "10px 20px", background: "#757575", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: isDeleting ? "not-allowed" : "pointer", fontSize: "14px" }}>Batal</button>
                <button onClick={handleDeleteLocation} disabled={isDeleting} style={{ padding: "10px 20px", background: isDeleting ? "#bdbdbd" : "#f44336", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: isDeleting ? "not-allowed" : "pointer", fontSize: "14px" }}>
                  {isDeleting ? "⏳ Menghapus..." : "🗑️ Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail */}
        {showModal && selectedArea && (
          <div onClick={closeDetail} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", width: "95%", maxWidth: "1400px", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px", background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)", borderBottom: "2px solid #e8e8e8", flexShrink: 0, flexWrap: "wrap", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  {/* ✅ FIXED: Tampilkan nama yang benar */}
                  <h2 style={{ margin: "0 0 4px 0", color: "#0d47a1", fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "700" }}>
                    Detail Area Hydrant - #{selectedArea.no}
                  </h2>
                  <p style={{ margin: "4px 0", color: "#1e88e5", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>
                    {parseAreaName(selectedArea).namaHydrant}
                  </p>
                  <p style={{ margin: "0", color: "#777", fontSize: "clamp(11px, 2.5vw, 12px)" }}>
                    {[parseAreaName(selectedArea).lokasiDetail, parseAreaName(selectedArea).zona].filter(Boolean).join(' — ')}
                  </p>
                </div>
                <button onClick={closeDetail} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999", padding: 0, width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>

              <div style={{ padding: "12px 20px", background: "#f9f9f9", borderBottom: "1px solid #e0e0e0" }}>
                <label style={{ fontWeight: "600", color: "#0d47a1", marginRight: "12px", fontSize: "13px" }}>Pilih Tanggal:</label>
                <select
                  value={selectedDateInModal || ""}
                  onChange={(e) => setSelectedDateInModal(e.target.value)}
                  style={{ color: "#0d47a1", padding: "6px 10px", border: "1px solid #1e88e5", borderRadius: "6px", fontSize: "13px", fontWeight: "500", minWidth: "140px" }}
                >
                  <option value="">-- Pilih Tanggal --</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}><p>Memuat data...</p></div>
                ) : !selectedDateInModal ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                    <p>{availableDates.length === 0 ? "📭 Belum ada data pengecekan untuk area ini" : "👆 Pilih tanggal untuk melihat detail"}</p>
                  </div>
                ) : !checksheetData || Object.keys(checksheetData).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}><p>Belum ada data pengecekan</p></div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "1100px", border: "2px solid #0d47a1" }}>
                      <thead>
                        <tr style={{ background: "#e3f2fd" }}>
                          <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "50px" }}>No</th>
                          <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "280px" }}>Item Pengecekan</th>
                          <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Hasil</th>
                          <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>Keterangan Temuan</th>
                          <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>Tindakan Perbaikan</th>
                          <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "120px" }}>Dokumentasi</th>
                          <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>PIC</th>
                          <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Due Date</th>
                          <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Inspector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectionItems.map((item, idx) => {
                          const entry = checksheetData[item.item_key];
                          const value = entry?.hasilPemeriksaan || "-";
                          const images = entry?.images || [];
                          return (
                            <tr key={item.item_key} style={{ background: idx % 2 === 0 ? "white" : "#fafafa" }}>
                              <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{item.no}</td>
                              <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", lineHeight: "1.5", verticalAlign: "top" }}>{item.item_check}</td>
                              <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "700", fontSize: "11px", background: value === "OK" ? "#c8e6c9" : value === "NG" ? "#ffcdd2" : "#fff", color: value === "OK" ? "#2e7d32" : value === "NG" ? "#c62828" : "#999" }}>
                                {value === "OK" ? "✓ OK" : value === "NG" ? "✗ NG" : "-"}
                              </td>
                              <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", fontSize: "10px", color: "#555", lineHeight: "1.4" }}>{entry?.keteranganTemuan || "-"}</td>
                              <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", fontSize: "10px", color: "#555", lineHeight: "1.4" }}>{entry?.tindakanPerbaikan || "-"}</td>
                              <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", verticalAlign: "top" }}>
                                {images.length > 0 ? (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                                    {images.map((imgUrl: string, i: number) => (
                                      <div key={i} onClick={() => openImagePreviewModal(imgUrl)} style={{ width: "50px", height: "50px", borderRadius: "4px", overflow: "hidden", cursor: "pointer", border: "1px solid #ccc" }}>
                                        <img src={imgUrl} alt={`Dok ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                      </div>
                                    ))}
                                  </div>
                                ) : "-"}
                              </td>
                              <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px" }}>{entry?.pic || "-"}</td>
                              <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px" }}>
                                {entry?.dueDate ? new Date(entry.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                              </td>
                              <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", fontWeight: "500", color: "#0d47a1", background: "#f5f9ff" }}>{entry?.inspector || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 20px", background: "#f5f7fa", borderTop: "1px solid #e8e8e8", flexShrink: 0 }}>
                <button onClick={closeDetail} style={{ padding: "8px 20px", background: "#bdbdbd", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>Tutup</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Preview Gambar Besar */}
        {showImagePreviewModal && (
          <div onClick={closeImagePreviewModal} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
              <img src={currentPreviewImage} alt="Preview" style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: "8px", border: "3px solid white", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }} />
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px", fontWeight: "500" }}>Click outside to close</div>
            </div>
          </div>
        )}

        {/* Modal Gambar Dokumentasi */}
        {showImageModal && (
          <div onClick={closeImageModal} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
              <img src={currentImageUrl} alt="Dokumentasi" style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", borderRadius: "8px", border: "3px solid white" }} />
              <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>Click outside to close</div>
            </div>
          </div>
        )}

        {/* QR Scanner Modal */}
        {isScanning && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }} onClick={() => { setIsScanning(false); if (qrScannerRef.current) { qrScannerRef.current.destroy(); qrScannerRef.current = null; } }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "8px", padding: "16px", textAlign: "center", maxWidth: "90vw", width: "100%" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>Scan Hydrant QR Code</h3>
              <video ref={videoRef} style={{ width: "100%", maxHeight: "60vh", borderRadius: "6px", background: "#000" }} />
              <p style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>Point your camera at the QR code on the hydrant</p>
              <button onClick={() => { setIsScanning(false); if (qrScannerRef.current) { qrScannerRef.current.destroy(); qrScannerRef.current = null; } }} style={{ marginTop: "16px", padding: "8px 20px", background: "#757575", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        <style jsx>{`
          @media (max-width: 768px) {
            div[style*="paddingLeft"] { padding-left: 25px !important; padding-right: 15px !important; }
          }
          @media (max-width: 480px) {
            div[style*="paddingLeft"] { padding-left: 15px !important; padding-right: 12px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}