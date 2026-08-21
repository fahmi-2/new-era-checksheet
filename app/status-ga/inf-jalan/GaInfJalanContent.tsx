// app/status-ga/inf-jalan/GaInfJalanContent.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
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
  category: string;
}

export function GaInfJalanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  const { isOnline, pendingCount } = useConnection();
  
  const openAreaParam = searchParams.get('openArea') || '';
  const TYPE_SLUG = 'inf-jalan';
  
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
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
  
  // ✅ Edit Data States - Dropdown & Delete Mode
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // ✅ Add Location Form State
  const [addFormData, setAddFormData] = useState({
    namaArea: '',
    kategori: 'Jalan Utama',
    lokasi: ''
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<any>(null);
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

  // ✅ Close edit modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
      }
    };
    if (showAddModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddModal]);

  // ✅ Load inspection items
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

  // ✅ Load areas
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

  // ✅ Auto-open modal jika ada openArea param
  useEffect(() => {
    if (!isMounted || !authVerified || !openAreaParam || areas.length === 0) return;
    const found = areas.find((item) => {
      const parts = item.name.split(' \u0007 ');
      return parts[0] === openAreaParam;
    });
    if (found) {
      setTimeout(() => openDetail(found), 300);
    }
  }, [isMounted, authVerified, openAreaParam, areas]);

  // ✅ Open detail dengan load data dari API
  const openDetail = async (area: Area) => {
    setSelectedArea(area);
    setShowModal(true);
    setIsLoading(true);
    try {
      const dates = await getAvailableDates(TYPE_SLUG, area.id);
      setAvailableDates(dates);
      if (dates.length > 0) {
        const latestDate = dates[0];
        setSelectedDate(latestDate);
        const data = await getChecklistByDate(TYPE_SLUG, area.id, latestDate);
        setChecksheetData(data);
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

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (selectedArea && newDate) {
      setIsLoading(true);
      try {
        const data = await getChecklistByDate(TYPE_SLUG, selectedArea.id, newDate);
        setChecksheetData(data);
      } catch (error) {
        console.error("Error loading date data:", error);
        setChecksheetData(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeDetail = () => {
    setSelectedArea(null);
    setChecksheetData(null);
    setAvailableDates([]);
    setSelectedDate("");
    setShowModal(false);
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
  const openImagePreviewModal = (imageUrl: string) => {
    setCurrentPreviewImage(imageUrl);
    setShowImagePreviewModal(true);
  };
  const closeImagePreviewModal = () => {
    setShowImagePreviewModal(false);
    setCurrentPreviewImage("");
  };

  // ✅ Handle Add Location
  const handleAddLocation = async () => {
    if (!addFormData.namaArea || !addFormData.lokasi) {
      alert('Nama Area dan Lokasi wajib diisi!');
      return;
    }
    try {
      setIsAdding(true);
      
      const maxNo = areas.reduce((max, area) => Math.max(max, area.no), 0);
      const newNo = maxNo + 1;
      const newName = `${addFormData.namaArea} \u0007 ${addFormData.kategori} \u0007 ${addFormData.lokasi}`;
      
      const response = await smartFetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          no: newNo,
          name: newName,
          location: addFormData.lokasi,
          category: addFormData.kategori,
          type_id: 2,
          is_active: true
        }),
        queueType: 'inf_jalan',
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
        location: addFormData.lokasi,
        category: addFormData.kategori
      };

      setAreas(prev => [...prev, newArea]);
      alert('✅ Lokasi berhasil ditambahkan!');
      
      setAddFormData({ namaArea: '', kategori: 'Jalan Utama', lokasi: '' });
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
        queueType: 'inf_jalan',
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

  // Filter data berdasarkan kategori dan search
  const filteredData = areas.filter(item => {
    const parts = item.name.split(' \u0007 ');
    const namaArea = item.name;
    const kategori = item.category || "";
    const lokasi = item.location || "";
    const matchKategori = filterKategori === "all" || kategori === filterKategori;
    const matchSearch = namaArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchKategori && matchSearch;
  });

  // ✅ Loading states
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
            style={{
              background: "none",
              border: "none",
              color: "#1976d2",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <ArrowLeft size={18} /> Kembali
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
              🛣️ GA Infrastruktur Jalan
            </h1>
            <p style={{
              margin: 0,
              color: "#e3f2fd",
              fontSize: "14px",
              fontWeight: "400"
            }}>
              Manajemen Data Inspeksi Infrastruktur Jalan & Boardess
            </p>
          </div>
        </div>

        {/* ✅ Filter & Search + Edit Data Button */}
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          border: "1px solid #e8e8e8"
        }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Category Filter */}
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#0d47a1",
                background: "white",
                cursor: "pointer",
                minWidth: "150px",
                flex: "1 1 150px"
              }}
            >
              <option value="all">Semua Kategori</option>
              <option value="Jalan Utama">Jalan Utama</option>
              <option value="Jalan Tambahan">Jalan Tambahan</option>
              <option value="Trotuar">Trotuar</option>
              <option value="Boardess">Boardess</option>
            </select>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Cari area atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#333",
                flex: "1 1 200px",
                minWidth: "200px"
              }}
            />

            {/* ✅ Edit Data Button (Dropdown dengan 2 OPSI) */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setShowEditDropdown(!showEditDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  background: isDeleteMode ? "#f44336" : "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                  height: "38px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}
              >
                {isDeleteMode ? <X size={16} /> : <Edit2 size={16} />}
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
                      minWidth: "200px",
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
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid #e8e8e8"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "800px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e8e8e8", width: "50px" }}>No</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e8e8e8", minWidth: "200px" }}>Nama Area</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e8e8e8", minWidth: "120px" }}>Kategori</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e8e8e8", minWidth: "180px" }}>Lokasi</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e8e8e8", minWidth: "100px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "2px solid #e8e8e8", minWidth: "220px" }}>Aksi</th>
                  {isDeleteMode && (
                    <th style={{ padding: "12px 16px", textAlign: "center", background: "#ffebee", fontWeight: "600", color: "#c62828", fontSize: "13px", width: "80px" }}>
                      🗑️ Hapus
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area, idx) => {
                  const parts = area.name.split(' \u0007 ');
                  const namaArea = parts[0] || '';
                  const kategori = parts[1] || '';
                  const lokasi = parts[2] || '';
                  
                  const status = areaStatuses[area.id] || {
                    statusLabel: "Loading...",
                    statusColor: "#757575",
                    lastCheck: "-"
                  };

                  return (
                    <tr key={area.id} style={{ transition: "background-color 0.2s ease", background: isDeleteMode ? "#fff5f5" : "white" }}>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center", fontWeight: "600", color: "#333" }}>{area.no}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontWeight: "500", color: "#1e88e5" }}>{namaArea}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", color: "#666", fontSize: "13px" }}>
                        <span style={{
                          padding: "4px 8px",
                          background: "#e3f2fd",
                          color: "#0d47a1",
                          borderRadius: "4px",
                          fontSize: "13px",
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "inline-block",
                          maxWidth: "140px"
                        }}>
                          {kategori}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", color: "#666", fontSize: "13px" }}>{lokasi}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <span style={{
                            padding: "4px 12px",
                            background: status.statusColor,
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            textTransform: "uppercase"
                          }}>
                            {status.statusLabel}
                          </span>
                          <span style={{ fontSize: "10px", color: "#999", fontWeight: "600" }}>
                            {status.lastCheck}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                          <button
                            onClick={() => openDetail(area)}
                            disabled={isDeleteMode}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              border: "none",
                              cursor: isDeleteMode ? "not-allowed" : "pointer",
                              background: isDeleteMode ? "#bdbdbd" : "#1e88e5",
                              color: "white"
                            }}
                          >
                            DETAIL
                          </button>
                          <a
                            href={`/e-checksheet-inf-jalan?areaName=${encodeURIComponent(namaArea)}&kategori=${encodeURIComponent(kategori)}&lokasi=${encodeURIComponent(lokasi)}`}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              border: "none",
                              cursor: isDeleteMode ? "not-allowed" : "pointer",
                              background: isDeleteMode ? "#bdbdbd" : "#4caf50",
                              color: "white",
                              textDecoration: "none",
                              display: "inline-block",
                              pointerEvents: isDeleteMode ? "none" : "auto"
                            }}
                          >
                            CHECK
                          </a>
                        </div>
                      </td>
                      {isDeleteMode && (
                        <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                          <button
                            onClick={() => {
                              setDeleteTarget({ id: area.id, name: namaArea });
                              setShowDeleteConfirm(true);
                            }}
                            style={{
                              padding: "6px 12px",
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
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ Modal Tambah Lokasi */}
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
              ref={editModalRef}
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
                {/* Nama Area */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    Nama Area <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.namaArea}
                    onChange={(e) => setAddFormData({ ...addFormData, namaArea: e.target.value })}
                    placeholder="Contoh: JALAN UTAMA 1"
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

                {/* Kategori */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    Kategori <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <select
                    value={addFormData.kategori}
                    onChange={(e) => setAddFormData({ ...addFormData, kategori: e.target.value })}
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
                    <option value="Jalan Utama">Jalan Utama</option>
                    <option value="Jalan Tambahan">Jalan Tambahan</option>
                    <option value="Trotuar">Trotuar</option>
                    <option value="Boardess">Boardess</option>
                  </select>
                </div>

                {/* Lokasi */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>
                    Lokasi <span style={{ color: "#f44336" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={addFormData.lokasi}
                    onChange={(e) => setAddFormData({ ...addFormData, lokasi: e.target.value })}
                    placeholder="Contoh: AREA PRODUKSI A"
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
                borderRadius: "12px",
                width: "98%",
                maxWidth: "1400px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "20px 24px",
                background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
                borderBottom: "2px solid #e8e8e8",
                flexShrink: 0,
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <h2 style={{ margin: "0 0 4px 0", color: "#0d47a1", fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "700" }}>
                    Detail Area Jalan - {selectedArea.no}
                  </h2>
                  <p style={{ margin: "4px 0", color: "#1e88e5", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>
                    {selectedArea.name.split(' \u0007 ')[0]}
                  </p>
                  <p style={{ margin: "0", color: "#777", fontSize: "clamp(11px, 2.5vw, 12px)" }}>
                    {selectedArea.name.split(' \u0007 ')[1]} - {selectedArea.name.split(' \u0007 ')[2]}
                  </p>
                </div>
                <button
                  onClick={closeDetail}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "28px",
                    cursor: "pointer",
                    color: "#999",
                    padding: 0,
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

              <div style={{ padding: "12px 20px", background: "#f9f9f9", borderBottom: "1px solid #e0e0e0" }}>
                <label style={{ fontWeight: "600", color: "#0d47a1", marginRight: "12px", fontSize: "13px" }}>
                  Pilih Tanggal:
                </label>
                <select
                  value={selectedDate || ""}
                  onChange={(e) => handleDateChange(e.target.value)}
                  style={{
                    color: "#0d47a1",
                    padding: "6px 10px",
                    border: "1px solid #1e88e5",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    minWidth: "140px"
                  }}
                >
                  <option value="">-- Pilih Tanggal --</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", fontSize: "14px" }}>
                    <p>Memuat data...</p>
                  </div>
                ) : !checksheetData || Object.keys(checksheetData).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", fontSize: "14px" }}>
                    <p>Belum ada data pengecekan</p>
                  </div>
                ) : !selectedDate ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#666", fontSize: "14px" }}>
                    <p>Pilih tanggal untuk melihat detail pemeriksaan</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "11px",
                        minWidth: "1200px",
                        border: "2px solid #0d47a1"
                      }}>
                        <thead>
                          <tr style={{ background: "#e3f2fd" }}>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", width: "50px" }}>No</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", minWidth: "280px" }}>Item Pengecekan</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", width: "100px" }}>Hasil Pemeriksaan</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", minWidth: "180px" }}>Keterangan Temuan</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", minWidth: "180px" }}>Tindakan Perbaikan</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", minWidth: "120px" }}>Dokumentasi</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", width: "80px" }}>PIC</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", width: "100px" }}>Due Date</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", width: "80px" }}>Verify</th>
                            <th style={{ padding: "12px 10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", fontSize: "10px", width: "100px" }}>Inspector</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inspectionItems.map((item) => {
                            const entry = checksheetData[item.item_key];
                            const value = entry?.hasilPemeriksaan || "-";
                            const images = entry?.images || [];
                            return (
                              <tr key={item.item_key}>
                                <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600", color: "#333", fontSize: "10px", background: "white", verticalAlign: "top" }}>{item.no}</td>
                                <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "500", color: "#333", fontSize: "10px", background: "white", verticalAlign: "top", lineHeight: "1.5" }}>{item.item_check}</td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "11px", fontWeight: "700", background: value === "OK" ? "#c8e6c9" : value === "NG" ? "#ffcdd2" : "#fff", color: value === "OK" ? "#2e7d32" : value === "NG" ? "#c62828" : "#999" }}>
                                  {value === "OK" ? "✓ OK" : value === "NG" ? "✗ NG" : "-"}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", fontSize: "10px", color: "#555", background: "white", lineHeight: "1.4" }}>
                                  {entry?.keteranganTemuan || "-"}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", fontSize: "10px", color: "#555", background: "white", lineHeight: "1.4" }}>
                                  {entry?.tindakanPerbaikan || "-"}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", verticalAlign: "top", background: "white" }}>
                                  {images.length > 0 ? (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                                      {images.map((imgUrl: string, idx: number) => (
                                        <div
                                          key={idx}
                                          onClick={() => openImagePreviewModal(imgUrl)}
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                            borderRadius: "4px",
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            border: "1px solid #ccc"
                                          }}
                                        >
                                          <img
                                            src={imgUrl}
                                            alt={`Dok ${idx + 1}`}
                                            style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover"
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", fontWeight: "500", color: "#333", background: "white" }}>
                                  {entry?.pic || "-"}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", color: "#555", background: "white" }}>
                                  {entry?.dueDate
                                    ? new Date(entry.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
                                    : "-"}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", fontWeight: "500", color: "#333", background: "white" }}>
                                  {entry?.verify || "-"}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", fontWeight: "500", color: "#333", background: "#f5f9ff" }}>
                                  {entry?.inspector || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "16px 20px",
                background: "#f5f7fa",
                borderTop: "1px solid #e8e8e8",
                flexShrink: 0
              }}>
                <button
                  onClick={closeDetail}
                  style={{
                    padding: "8px 20px",
                    background: "#bdbdbd",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* ✅ Modal Gambar Dokumentasi */}
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

        <style jsx>{`
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

            input[type="search"],
            input[type="text"],
            select {
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

            input[type="search"],
            input[type="text"],
            select {
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