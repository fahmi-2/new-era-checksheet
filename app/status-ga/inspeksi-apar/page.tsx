// app/status-ga/inspeksi-apar/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { AlertTriangle, FileText, BarChart2, ArrowLeft, ShieldCheck, MapPin, Layers, Plus, Edit2, Trash2 } from "lucide-react";
import { aparDataBySlug, type AparDataItem } from "@/lib/apar-data";

// Fallback Mapping area names
const DEFAULT_AREA_NAMES: Record<string, string> = {
  "area-locker-security": "AREA LOCKER & SECURITY",
  "area-kantin": "AREA KANTIN",
  "area-auditorium": "AREA AUDITORIUM",
  "area-main-office": "AREA MAIN OFFICE",
  "exim": "EXIM",
  "area-genba-a": "AREA GENBA A",
  "area-mezzanine-genba-a": "AREA MEZZANINE GENBA A",
  "jig-proto-1-area-receiving": "JIG PROTO 1 AREA RECEIVING",
  "stock-control-area": "STOCK CONTROL AREA",
  "jig-proto-2-cnc-room": "JIG PROTO 2 CNC ROOM",
  "area-training-dining-mtc": "AREA TRAINING & DINING ROOM",
  "genba-c": "GENBA C",
  "area-pump-room-warehouse": "AREA PUMP ROOM & WAREHOUSE",
  "power-house-genba-a": "POWER HOUSE (GENBA A)",
  "power-house-genba-c": "POWER HOUSE (GENBA C)",
  "area-tps-b3": "AREA TPS B3",
  "new-building-warehouse": "NEW BUILDING WAREHOUSE",
  "genba-b": "GENBA B",
  "power-house-workshop": "POWER HOUSE & WORKSHOP",
  "area-segitiga-ga": "AREA SEGITIGA GA",
  "area-parkir-motor": "AREA PARKIR MOTOR",
  "forklift": "FORKLIFT",
  "samping-pagar-rak-helm": "SAMPING PAGAR RAK HELM",
  "belakang-kantin": "BELAKANG KANTIN",
  "ir-room": "IR ROOM",
  "area-auditorium-outdoor": "AREA AUDITORIUM OUTDOOR",
  "area-klinik": "AREA KLINIK",
  "mesin-raychem-genba-a": "MESIN RAYCHEM GENBA A",
  "mesin-raychem-genba-b": "MESIN RAYCHEM GENBA B",
  "mesin-raychem-genba-c": "MESIN RAYCHEM GENBA C",
};

export default function InspeksiAparPage() {
  const router = useRouter();
  const { user } = useAuth();

  const today = new Date().toISOString().split("T")[0];
  const [searchTerm, setSearchTerm] = useState("");
  const [redirected, setRedirected] = useState(false);
  const [areaNames, setAreaNames] = useState<Record<string, string>>(DEFAULT_AREA_NAMES);
  const [dbAreaCounts, setDbAreaCounts] = useState<Record<string, number>>({});

  // Admin Area Management Modal State
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingAreaSlug, setEditingAreaSlug] = useState<string | null>(null);
  const [areaForm, setAreaForm] = useState({ slug: "", name: "" });
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = !!(user && ["admin", "superadmin"].includes(user.role));

  // Validasi akses
  useEffect(() => {
    if (redirected) return;
    if (!user || !isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, redirected, router]);

  // Fetch count master APAR & daftar area dari database
  const fetchMasterConfig = async () => {
    try {
      const res = await fetch(`/api/apar/master?_t=${Date.now()}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          if (result.areas && Object.keys(result.areas).length > 0) {
            setAreaNames(result.areas);
          }
          if (result.countsByArea) {
            setDbAreaCounts(result.countsByArea);
          }
        }
      }
    } catch (err) {
      console.error("Gagal mengambil master counts APAR:", err);
    }
  };

  useEffect(() => {
    fetchMasterConfig();
  }, []);

  // Helper untuk mendapatkan jumlah APAR per zona
  const getZoneAparCount = (slug: string) => {
    if (dbAreaCounts[slug] !== undefined) {
      return dbAreaCounts[slug];
    }
    return aparDataBySlug[slug]?.length || 0;
  };

  // Total keseluruhan APAR di semua zona
  const totalAparAllZones = useMemo(() => {
    return Object.keys(areaNames).reduce((acc, slug) => {
      return acc + getZoneAparCount(slug);
    }, 0);
  }, [areaNames, dbAreaCounts]);

  const totalZonesCount = Object.keys(areaNames).length;

  const checkIfFilled = (slug: string) => {
    if (typeof window === "undefined") return false;
    const key = `ga_apar_${slug}_${today}`;
    return localStorage.getItem(key) !== null;
  };

  const handleChecklistClick = (slug: string) => {
    router.push(`/status-ga/inspeksi-apar/${slug}?date=${today}`);
  };

  // Admin Area Actions
  const handleOpenAddArea = () => {
    setEditingAreaSlug(null);
    setAreaForm({ slug: "", name: "" });
    setShowAreaModal(true);
  };

  const handleOpenEditArea = (slug: string, name: string) => {
    setEditingAreaSlug(slug);
    setAreaForm({ slug, name });
    setShowAreaModal(true);
  };

  const handleDeleteArea = async (slug: string) => {
    const areaTitle = areaNames[slug] || slug;
    if (!confirm(`Apakah Anda yakin ingin menghapus zona APAR "${areaTitle}"?`)) return;

    try {
      const newAreas = { ...areaNames };
      delete newAreas[slug];

      const res = await fetch("/api/apar/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areas: newAreas,
          updated_by: user?.fullName || "admin"
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menghapus zona");

      setAreaNames(newAreas);
      alert(`✅ Zona APAR "${areaTitle}" berhasil dihapus!`);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleSaveAreaModal = async () => {
    if (!areaForm.name.trim()) {
      alert("Nama area/zona wajib diisi!");
      return;
    }

    try {
      setIsSaving(true);
      const newAreas = { ...areaNames };

      if (editingAreaSlug) {
        // Edit nama
        newAreas[editingAreaSlug] = areaForm.name.trim().toUpperCase();
      } else {
        // Tambah baru
        const generatedSlug = areaForm.slug.trim()
          ? areaForm.slug.trim().toLowerCase().replace(/\s+/g, '-')
          : `area-${areaForm.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        if (newAreas[generatedSlug]) {
          alert("ID atau Nama zona sudah ada, gunakan nama yang lain!");
          setIsSaving(false);
          return;
        }

        newAreas[generatedSlug] = areaForm.name.trim().toUpperCase();
      }

      const res = await fetch("/api/apar/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areas: newAreas,
          updated_by: user?.fullName || "admin"
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Gagal menyimpan area");

      setAreaNames(newAreas);
      setShowAreaModal(false);
      alert(`✅ Zona APAR berhasil ${editingAreaSlug ? 'diperbarui' : 'ditambahkan'}!`);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  // Build areas from mapping
  const areas = Object.entries(areaNames).map(([slug, title]) => ({
    id: slug,
    title: title,
    desc: `Inspeksi APAR - ${title}`,
    count: getZoneAparCount(slug),
  }));

  const filteredAreas = areas.filter(area =>
    area.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga")}
            className="btn-back"
            aria-label="Kembali ke halaman utama"
          >
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <div className="header-title">
            <AlertTriangle size={28} color="#ffffff" />
            Inspeksi APAR
          </div>
          <div className="header-subtitle">Daily check alat pemadam api ringan</div>
        </div>

        {/* 👑 Admin Actions Toolbar */}
        {isAdmin && (
          <div style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
            borderRadius: "12px",
            padding: "14px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            color: "white"
          }}>
            <div>
              <div style={{ fontWeight: "700", fontSize: "14px" }}>👑 Kelola Master Zona APAR (Admin)</div>
              <div style={{ fontSize: "12px", color: "#bfdbfe" }}>
                Admin dapat menambah area/zona APAR baru, mengubah nama zona, atau menghapus zona.
              </div>
            </div>
            <button
              onClick={handleOpenAddArea}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              <Plus size={16} /> Tambah Zona APAR
            </button>
          </div>
        )}

        {/* Info Cards - Ringkasan Total APAR Master Data & Zona */}
        <div className="stats-cards-container">
          <div className="stat-card">
            <div className="stat-icon-wrapper fire">
              <ShieldCheck size={26} />
            </div>
            <div className="stat-details">
              <span className="stat-title">Total APAR Terdaftar</span>
              <div className="stat-number-wrapper">
                <span className="stat-value">{totalAparAllZones}</span>
                <span className="stat-unit">Unit APAR</span>
              </div>
              <span className="stat-desc">Sesuai Master Data Seluruh Area</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper location">
              <MapPin size={26} />
            </div>
            <div className="stat-details">
              <span className="stat-title">Total Zona / Area</span>
              <div className="stat-number-wrapper">
                <span className="stat-value">{totalZonesCount}</span>
                <span className="stat-unit">Zona Aktif</span>
              </div>
              <span className="stat-desc">Area Terdaftar di Sistem GA</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper coverage">
              <Layers size={26} />
            </div>
            <div className="stat-details">
              <span className="stat-title">Rata-rata per Zona</span>
              <div className="stat-number-wrapper">
                <span className="stat-value">
                  {totalZonesCount > 0 ? (totalAparAllZones / totalZonesCount).toFixed(1) : 0}
                </span>
                <span className="stat-unit">Unit / Zona</span>
              </div>
              <span className="stat-desc">Distribusi APAR di Lingkungan Kerja</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Cari area atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Grid Areas */}
        {filteredAreas.length === 0 ? (
          <div className="no-results">
            Tidak ada area ditemukan untuk "{searchTerm}"
          </div>
        ) : (
          <div className="categories-grid">
            {filteredAreas.map((area) => {
              const isFilled = checkIfFilled(area.id);
              return (
                <div key={area.id} className="category-card">
                  <div className={`card-header ${isFilled ? "filled" : ""}`}>
                    <h2>{area.title}</h2>
                    <div className="apar-badge" title={`Terdapat ${area.count} APAR pada zona ini`}>
                      <ShieldCheck size={14} />
                      <span>{area.count} APAR</span>
                    </div>
                  </div>
                  <p className="card-desc">{area.desc}</p>

                  {isAdmin && (
                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "6px",
                      padding: "0 20px 8px 20px"
                    }}>
                      <button
                        onClick={() => handleOpenEditArea(area.id, area.title)}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          color: "#334155",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Edit2 size={12} /> Edit Zona
                      </button>
                      <button
                        onClick={() => handleDeleteArea(area.id)}
                        style={{
                          background: "#fee2e2",
                          border: "1px solid #fca5a5",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          color: "#dc2626",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  )}

                  <div className="card-actions">
                    <button
                      onClick={() => handleChecklistClick(area.id)}
                      className={`btn-checklist ${isFilled ? "btn-filled" : ""}`}
                    >
                      <FileText size={16} />
                      {isFilled ? "Sudah Diisi" : "Isi Checklist"}
                    </button>

                    <button
                      onClick={() => router.push(`/status-ga/inspeksi-apar/${area.id}/riwayat`)}
                      className="btn-riwayat"
                    >
                      <BarChart2 size={16} />
                      Riwayat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Add/Edit Area */}
        {showAreaModal && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 3000,
            padding: "20px",
            backdropFilter: "blur(4px)"
          }}>
            <div style={{
              background: "white",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              overflow: "hidden"
            }}>
              <div style={{
                padding: "16px 20px",
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                  {editingAreaSlug ? "Edit Nama Zona APAR" : "Tambah Zona APAR Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAreaModal(false)}
                  style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Nama Zona APAR
                  </label>
                  <input
                    type="text"
                    value={areaForm.name}
                    onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                    placeholder="Contoh: AREA GUDANG KIMIA"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "14px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div style={{
                padding: "14px 20px",
                background: "#f1f5f9",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px"
              }}>
                <button
                  type="button"
                  onClick={() => setShowAreaModal(false)}
                  style={{
                    padding: "8px 16px",
                    background: "#94a3b8",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAreaModal}
                  disabled={isSaving}
                  style={{
                    padding: "8px 18px",
                    background: isSaving ? "#93c5fd" : "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: isSaving ? "not-allowed" : "pointer"
                  }}
                >
                  {isSaving ? "Menyimpan..." : "💾 Simpan Zona"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Box - Petunjuk Penggunaan */}
        <div className="info-box" style={{ marginTop: '24px' }}>
          <h3>💡 Cara Penggunaan:</h3>
          <ul>
            <li>Klik <strong>"Isi Checklist"</strong> untuk membuka form inspeksi</li>
            <li>Form akan terbuka namun <strong>tidak dapat diisi</strong> sebelum scan QR code area (kecuali Administrator)</li>
            <li>Klik tombol <strong>"🔍 Scan Sekarang"</strong> di banner kuning untuk mulai scan</li>
            <li>Setelah scan berhasil, form akan <strong>otomatis aktif</strong> dan siap diisi</li>
            <li>Untuk melihat data historis, klik tombol <strong>"Riwayat"</strong></li>
          </ul>
        </div>
      </div>

      {/* ── STYLES (SAMA PERSIS FIRE ALARM) ── */}
      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }
        .page-content {
          flex: 1;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Header Banner */
        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 16px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }
        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
        .header-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .header-subtitle {
          font-size: 0.9rem;
          opacity: 0.9;
          margin: 0;
          font-weight: 400;
          text-align: right;
        }

        /* Stats Cards Container */
        .stats-cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
          transition: all 0.25s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
          border-color: #93c5fd;
        }
        .stat-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-icon-wrapper.fire {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626;
        }
        .stat-icon-wrapper.location {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #2563eb;
        }
        .stat-icon-wrapper.coverage {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #d97706;
        }
        .stat-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .stat-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat-number-wrapper {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }
        .stat-unit {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
        }
        .stat-desc {
          font-size: 0.78rem;
          color: #94a3b8;
        }

        /* Search Bar */
        .search-container {
          margin-bottom: 24px;
        }
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          border: 2px solid #cbd5e1;
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }
        .search-input {
          flex: 1;
          padding: 14px 20px;
          font-size: 1rem;
          border: none;
          outline: none;
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 40px;
          color: #64748b;
          font-size: 1.1rem;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        /* Grid Areas */
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
        }
        .category-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          transition: all 0.3s ease;
          border: 2px solid #e2e8f0;
        }
        .category-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          border-color: #3b82f6;
        }
        .card-header {
          padding: 16px 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #bbdefb;
          gap: 10px;
        }
        .card-header.filled {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-color: #c8e6c9;
        }
        .card-header h2 {
          margin: 0;
          font-size: 1.15rem;
          color: #0d47a1;
          font-weight: 700;
          flex: 1;
        }
        .apar-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(13, 71, 161, 0.12);
          color: #0d47a1;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
          white-space: nowrap;
          border: 1px solid rgba(13, 71, 161, 0.2);
        }
        .card-header.filled .apar-badge {
          background: rgba(22, 101, 52, 0.12);
          color: #15803d;
          border-color: rgba(22, 101, 52, 0.2);
        }
        .card-desc {
          padding: 16px 20px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }

        /* Card Actions */
        .card-actions {
          padding: 16px 20px;
          display: flex;
          gap: 12px;
          border-top: 1px solid #e2e8f0;
        }
        .btn-checklist,
        .btn-riwayat {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.25s ease;
          text-align: center;
          min-height: 42px;
          cursor: pointer;
          border: none;
          outline: none;
        }
        .btn-checklist {
          background: #dc2626;
          color: white;
        }
        .btn-checklist:hover {
          background: #b91c1c;
          transform: scale(1.03);
          box-shadow: 0 4px 8px rgba(185, 28, 28, 0.3);
        }
        .btn-checklist.btn-filled {
          background: #16a34a;
          cursor: not-allowed;
        }
        .btn-checklist.btn-filled:hover {
          background: #16a34a;
          transform: none;
          box-shadow: none;
        }
        .btn-riwayat {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }
        .btn-riwayat:hover {
          background: #e2e8f0;
          border-color: #94a8c9;
          color: #1e293b;
          transform: scale(1.03);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }

        /* Info Box */
        .info-box {
          background: linear-gradient(135deg, #fff8e1 0%, #fffde7 100%);
          border-left: 5px solid #ffc107;
          padding: 20px;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #5d4037;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .info-box h3 {
          margin: 0 0 12px 0;
          color: #e65100;
          font-weight: 700;
        }
        .info-box ul {
          list-style: disc;
          padding-left: 20px;
          margin: 0;
        }
        .info-box li {
          margin-bottom: 8px;
          line-height: 1.6;
        }

        /* Responsif Mobile */
        @media (max-width: 768px) {
          .page-content {
            padding: 16px 12px;
          }
          .header-banner {
            flex-direction: column;
            text-align: center;
            gap: 12px;
            padding: 16px;
          }
          .btn-back {
            align-self: flex-start;
            padding: 6px 12px;
            gap: 6px;
            font-size: 0.85rem;
          }
          .header-title {
            font-size: 1.6rem;
            justify-content: center;
          }
          .header-subtitle {
            text-align: center;
            align-self: flex-end;
          }
          .categories-grid {
            grid-template-columns: 1fr;
          }
          .card-actions {
            flex-direction: column;
          }
          .btn-checklist,
          .btn-riwayat {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}