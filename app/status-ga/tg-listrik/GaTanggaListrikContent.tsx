// app/status-ga/tg-listrik/GaTanggaListrikContent.tsx

"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { ArrowLeft, Plus, Trash2, Edit2 } from "lucide-react";

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

interface AreaStatus {
  [areaId: number]: {
    statusLabel: string;
    statusColor: string;
    lastCheck: string;
  };
}

interface Props {
  openArea?: string;
}

export function GaTanggaListrikContent({ openArea = '' }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isOnline, pendingCount } = useConnection();
  
  const TYPE_SLUG = 'tg-listrik';
  
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
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [areaStatuses, setAreaStatuses] = useState<AreaStatus>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  // ✅ Edit Data States
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addFormData, setAddFormData] = useState({ namaArea: '', lokasi: '' });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const addModalRef = useRef<HTMLDivElement>(null);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEditDropdown(false);
      }
    };
    if (showEditDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEditDropdown]);

  // Load inspection items
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setInspectionItems(items);
      } catch (error) {
        console.error("❌ Failed to load checklist items:", error);
      }
    };
    loadItems();
  }, []);

  // Load areas
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const data = await getAreasByType(TYPE_SLUG);
        setAreas(data);
      } catch (error) {
        console.error("❌ Failed to load areas:", error);
      }
    };
    loadAreas();
  }, []);

  // Load status semua area
  useEffect(() => {
    if (areas.length === 0 || isLoadingStatuses) return;
    const loadAllStatuses = async () => {
      setIsLoadingStatuses(true);
      const statusMap: AreaStatus = {};
      for (const area of areas) {
        try {
          const dates = await getAvailableDates(TYPE_SLUG, area.id);
          if (dates.length > 0) {
            statusMap[area.id] = {
              statusLabel: "Ada Data",
              statusColor: "#4caf50",
              lastCheck: new Date(dates[0]).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
            };
          } else {
            statusMap[area.id] = { statusLabel: "Belum Ada Data", statusColor: "#9e9e9e", lastCheck: "-" };
          }
        } catch {
          statusMap[area.id] = { statusLabel: "Error", statusColor: "#f44336", lastCheck: "-" };
        }
      }
      setAreaStatuses(statusMap);
      setIsLoadingStatuses(false);
    };
    loadAllStatuses();
  }, [areas]);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || !isAuthorizedForChecksheet(user)) router.push("/login-page");
  }, [user, loading, router]);

  // Auto-open modal
  useEffect(() => {
    if (!isMounted || loading || !openArea || areas.length === 0) return;
    const found = areas.find((item) => item.name === openArea);
    if (found) setTimeout(() => openDetail(found), 100);
  }, [isMounted, loading, openArea, areas]);

  // Load data ketika tanggal berubah di modal
  useEffect(() => {
    if (!selectedArea || !selectedDateInModal || !showModal) return;
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
  }, [selectedDateInModal, selectedArea, showModal]);

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

  const openImageModal = (url: string) => { setCurrentImageUrl(url); setShowImageModal(true); };
  const closeImageModal = () => { setShowImageModal(false); setCurrentImageUrl(""); };

  // ✅ Tambah Lokasi
  const handleAddLocation = async () => {
    if (!addFormData.namaArea || !addFormData.lokasi) {
      alert('Semua field wajib diisi!');
      return;
    }
    try {
      setIsAdding(true);
      const maxNo = areas.reduce((max, a) => Math.max(max, a.no), 0);
      const response = await smartFetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          no: maxNo + 1,
          name: addFormData.namaArea,
          location: addFormData.lokasi,
          type_id: 1,
          is_active: true
        }),
        queueType: 'tg_listrik',
        metadata: { areaCode: TYPE_SLUG }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Gagal menyimpan');
      setAreas(prev => [...prev, { id: result.data?.id || Date.now(), no: maxNo + 1, name: addFormData.namaArea, location: addFormData.lokasi }]);
      alert('✅ Lokasi berhasil ditambahkan!');
      setAddFormData({ namaArea: '', lokasi: '' });
      setShowAddModal(false);
      setShowEditDropdown(false);
    } catch (error) {
      alert('❌ Gagal menambahkan lokasi: ' + (error as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  // ✅ Hapus Lokasi
  const handleDeleteLocation = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const response = await smartFetch(`/e-checksheet-ga/api/ga/checksheet/${TYPE_SLUG}/areas/${deleteTarget.id}`, {
        method: 'DELETE',
        queueType: 'tg_listrik',
        metadata: { areaCode: TYPE_SLUG }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Gagal menghapus');
      setAreas(prev => prev.filter(a => a.id !== deleteTarget.id));
      alert('✅ Lokasi berhasil dihapus!');
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      alert('❌ Gagal menghapus lokasi: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredData = areas.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isMounted) return null;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p style={{ fontSize: "16px", color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (!user || !isAuthorizedForChecksheet(user)) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
      <div style={{
        paddingLeft: "95px",
        paddingRight: "25px",
        paddingTop: "32px",
        paddingBottom: "32px",
        maxWidth: "1400px",
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
            <button
              onClick={() => router.push("/status-ga")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "12px"
              }}
            >
              <ArrowLeft size={16} /> Kembali
            </button>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700" }}>
              GA Tangga Listrik (AWP)
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
              Manajemen Data Inspeksi Tangga Listrik (Aerial Work Platform)
            </p>
          </div>
        </div>

        {/* Search + Edit Data */}
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          border: "1px solid #e8e8e8"
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="🔍 Cari area atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "10px 14px",
                border: "1px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333",
                outline: "none"
              }}
            />

            {/* ✅ Edit Data Dropdown */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setShowEditDropdown(!showEditDropdown)}
                style={{
                  padding: "10px 16px",
                  background: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Edit2 size={16} /> Edit Data
              </button>

              {showEditDropdown && (
                <div style={{
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
                }}>
                  <button
                    onClick={() => { setShowAddModal(true); setShowEditDropdown(false); }}
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
                      gap: "10px"
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
                  <button
                    onClick={() => { setIsDeleteMode(!isDeleteMode); setShowEditDropdown(false); }}
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
                      gap: "10px"
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
                <Trash2 size={18} /> Mode Hapus Aktif – Klik ikon sampah untuk menghapus
              </div>
              <button
                onClick={() => setIsDeleteMode(false)}
                style={{ padding: "6px 12px", background: "#f44336", color: "white", border: "none", borderRadius: "4px", fontWeight: "500", cursor: "pointer", fontSize: "13px" }}
              >
                Selesai
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #e8e8e8" }}>
          {isLoadingStatuses && (
            <div style={{ padding: "12px 20px", background: "#fff3cd", borderBottom: "1px solid #e8e8e8", color: "#856404", fontSize: "13px", textAlign: "center" }}>
              ⏳ Loading status data...
            </div>
          )}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Nama Area</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Lokasi</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Aksi</th>
                  {isDeleteMode && (
                    <th style={{ padding: "14px 16px", textAlign: "center", background: "#ffebee", fontWeight: "600", color: "#c62828", fontSize: "13px", borderBottom: "2px solid #e8e8e8", width: "80px" }}>
                      🗑️ Hapus
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={isDeleteMode ? 6 : 5} style={{ padding: "40px 20px", textAlign: "center", color: "#999" }}>
                      {searchTerm ? "Tidak ada data yang sesuai" : "Tidak ada data"}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((area) => {
                    const status = areaStatuses[area.id] || { statusLabel: "Loading...", statusColor: "#9e9e9e", lastCheck: "-" };
                    return (
                      <tr key={area.id} style={{ background: isDeleteMode ? "#fff5f5" : "white" }}>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center", fontWeight: "600", color: "#0d47a1" }}>{area.no}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", fontWeight: "500", color: "#1e88e5" }}>{area.name}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", color: "#666", fontSize: "13px" }}>{area.location}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <span style={{ padding: "5px 12px", background: status.statusColor, color: "white", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                              {status.statusLabel}
                            </span>
                            <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{status.lastCheck}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              onClick={() => openDetail(area)}
                              disabled={isDeleteMode}
                              style={{ padding: "7px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", background: isDeleteMode ? "#bdbdbd" : "#1e88e5", color: "white", border: "none", cursor: isDeleteMode ? "not-allowed" : "pointer" }}
                            >
                              DETAIL
                            </button>
                            <a
                              href={`/e-checksheet-ga/e-checksheet-tg-listrik?areaName=${encodeURIComponent(area.name)}&lokasi=${encodeURIComponent(area.location)}`}
                              style={{ padding: "7px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", background: isDeleteMode ? "#bdbdbd" : "#4caf50", color: "white", textDecoration: "none", display: "inline-block", pointerEvents: isDeleteMode ? "none" : "auto" }}
                            >
                              CHECK
                            </a>
                          </div>
                        </td>
                        {isDeleteMode && (
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                            <button
                              onClick={() => { setDeleteTarget({ id: area.id, name: area.name }); setShowDeleteConfirm(true); }}
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

        {/* ✅ Modal Tambah Lokasi */}
        {showAddModal && (
          <div onClick={() => setShowAddModal(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
            <div ref={addModalRef} onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "480px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: "#1976d2" }}>
                <h2 style={{ margin: 0, color: "white", fontSize: "18px", fontWeight: "600" }}>📍 Tambah Lokasi Baru</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", fontSize: "24px", cursor: "pointer", color: "white", padding: "0" }}>×</button>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>Nama Area <span style={{ color: "#f44336" }}>*</span></label>
                  <input
                    type="text"
                    value={addFormData.namaArea}
                    onChange={(e) => setAddFormData({ ...addFormData, namaArea: e.target.value })}
                    placeholder="Contoh: TANGGA LISTRIK A"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0d0d0", borderRadius: "6px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: "600", color: "#424242" }}>Lokasi <span style={{ color: "#f44336" }}>*</span></label>
                  <input
                    type="text"
                    value={addFormData.lokasi}
                    onChange={(e) => setAddFormData({ ...addFormData, lokasi: e.target.value })}
                    placeholder="Contoh: Gudang 1, Lantai 2"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d0d0d0", borderRadius: "6px", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", padding: "16px 24px", background: "#f5f5f5", borderTop: "1px solid #e0e0e0" }}>
                <button onClick={() => setShowAddModal(false)} style={{ padding: "10px 20px", background: "#757575", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: "pointer", fontSize: "14px" }}>Batal</button>
                <button onClick={handleAddLocation} disabled={isAdding} style={{ padding: "10px 20px", background: isAdding ? "#bdbdbd" : "#1976d2", color: "white", border: "none", borderRadius: "6px", fontWeight: "500", cursor: isAdding ? "not-allowed" : "pointer", fontSize: "14px" }}>
                  {isAdding ? "⏳ Menyimpan..." : "✅ Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Modal Konfirmasi Hapus */}
        {showDeleteConfirm && (
          <div onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2500, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "420px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", overflow: "hidden" }}>
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

        {/* ✅ Modal Detail - Verify column dihapus */}
        {showModal && selectedArea && (
          <div onClick={closeDetail} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", width: "95%", maxWidth: "1400px", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}>
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px", background: "#f5f7fa", borderBottom: "2px solid #e8e8e8" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", color: "#0d47a1", fontSize: "20px", fontWeight: "700" }}>Detail Tangga Listrik</h2>
                  <p style={{ margin: "4px 0", color: "#1e88e5", fontWeight: "500", fontSize: "14px" }}>{selectedArea.name}</p>
                  <p style={{ margin: "0", color: "#777", fontSize: "12px" }}>{selectedArea.location}</p>
                </div>
                <button onClick={closeDetail} style={{ background: "none", border: "none", fontSize: "32px", cursor: "pointer", color: "#999", lineHeight: "1" }}>×</button>
              </div>

              {/* Dropdown Tanggal */}
              <div style={{ padding: "14px 20px", background: "#f9f9f9", borderBottom: "1px solid #e0e0e0" }}>
                <label style={{ fontWeight: "600", color: "#0d47a1", marginRight: "12px", fontSize: "13px" }}>Pilih Tanggal:</label>
                <select
                  value={selectedDateInModal}
                  onChange={(e) => setSelectedDateInModal(e.target.value)}
                  disabled={availableDates.length === 0}
                  style={{ color: "#0d47a1", padding: "8px 12px", border: "1px solid #1e88e5", borderRadius: "6px", fontSize: "13px", fontWeight: "500", minWidth: "160px", cursor: availableDates.length > 0 ? "pointer" : "not-allowed" }}
                >
                  {availableDates.length === 0 ? (
                    <option value="">Belum ada data</option>
                  ) : (
                    <>
                      <option value="">-- Pilih Tanggal --</option>
                      {availableDates.map(date => (
                        <option key={date} value={date}>
                          {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                {isLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>⏳ Loading data...</div>
                ) : !selectedDateInModal ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                    {availableDates.length === 0 ? "📭 Belum ada data pengecekan untuk area ini" : "👆 Pilih tanggal untuk melihat detail"}
                  </div>
                ) : !checksheetData ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>❌ Tidak ada data untuk tanggal ini</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "1100px", border: "2px solid #0d47a1" }}>
                      <thead>
                        <tr style={{ background: "#e3f2fd" }}>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "50px" }}>No</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "300px" }}>Item Pengecekan</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Hasil</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>Keterangan Temuan</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>Tindakan Perbaikan</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "120px" }}>Dokumentasi</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>PIC</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Due Date</th>
                          <th style={{ padding: "10px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Inspector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectionItems.length === 0 ? (
                          <tr><td colSpan={9} style={{ padding: "20px", textAlign: "center", color: "#999" }}>Loading items...</td></tr>
                        ) : (
                          inspectionItems.map((item, idx) => {
                            const entry = checksheetData[item.item_key] || null;
                            const images = entry?.images || [];
                            return (
                              <tr key={item.id} style={{ background: idx % 2 === 0 ? "white" : "#fafafa" }}>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{item.no}</td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", lineHeight: "1.4" }}>
                                  <div style={{ fontWeight: "600", color: "#0d47a1", marginBottom: "4px" }}>{item.item_group}</div>
                                  <div style={{ color: "#555" }}>{item.item_check}</div>
                                </td>
                                <td style={{
                                  padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "700", fontSize: "12px",
                                  background: entry?.hasilPemeriksaan === "OK" ? "#c8e6c9" : entry?.hasilPemeriksaan === "NG" ? "#ffcdd2" : "#fff",
                                  color: entry?.hasilPemeriksaan === "OK" ? "#2e7d32" : entry?.hasilPemeriksaan === "NG" ? "#c62828" : "#999"
                                }}>
                                  {entry?.hasilPemeriksaan === "OK" ? "✓ OK" : entry?.hasilPemeriksaan === "NG" ? "✗ NG" : "-"}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", fontSize: "10px" }}>{entry?.keteranganTemuan || "-"}</td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", fontSize: "10px" }}>{entry?.tindakanPerbaikan || "-"}</td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center" }}>
                                  {images.length > 0 ? (
                                    <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
                                      {images.map((imgUrl: string, imgIdx: number) => (
                                        <div key={imgIdx} onClick={() => openImageModal(imgUrl)} style={{ width: "50px", height: "50px", borderRadius: "4px", overflow: "hidden", cursor: "pointer", border: "1px solid #ccc" }}>
                                          <img src={imgUrl} alt={`Dok ${imgIdx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                      ))}
                                    </div>
                                  ) : <span style={{ color: "#999" }}>-</span>}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px" }}>{entry?.pic || "-"}</td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px" }}>
                                  {entry?.dueDate ? new Date(entry.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                                </td>
                                <td style={{ padding: "8px 6px", border: "1px solid #0d47a1", textAlign: "center", fontSize: "10px", fontWeight: "600", color: "#0d47a1" }}>{entry?.inspector || "-"}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: "16px 24px", background: "#f5f7fa", borderTop: "1px solid #e8e8e8", textAlign: "right" }}>
                <button onClick={closeDetail} style={{ padding: "8px 20px", background: "#bdbdbd", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>Tutup</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Gambar */}
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