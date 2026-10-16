// app/status-ga/checksheet-toilet/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { AlertTriangle, FileText, BarChart2, ArrowLeft, Plus, Settings, Edit2, Trash2 } from "lucide-react";

interface AreaItem {
  id: string;
  title: string;
  desc: string;
  type?: string;
}

const DEFAULT_AREAS: AreaItem[] = [
  { id: "toilet-driver", title: "TOILET - DRIVER", desc: "Toilet umum", type: "general" },
  { id: "toilet-bea-cukai", title: "TOILET - BEA CUKAI", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-parkir", title: "TOILET - PARKIR", desc: "Toilet umum", type: "general" },
  { id: "toilet-c2", title: "TOILET - C2", desc: "Toilet wanita", type: "wanita" },
  { id: "toilet-c1", title: "TOILET - C1", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-d", title: "TOILET - D", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-auditorium", title: "TOILET - AUDITORIUM", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-whs", title: "TOILET - WHS", desc: "Toilet wanita", type: "wanita" },
  { id: "toilet-b1", title: "TOILET - B1", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-b2", title: "TOILET - B2", desc: "Toilet wanita", type: "wanita" },
  { id: "toilet-genba-b", title: "TOILET - GENBA B", desc: "Toilet wanita", type: "wanita" },
  { id: "toilet-a", title: "TOILET - A", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-lobby", title: "TOILET - LOBBY", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-office-main", title: "TOILET - OFFICE MAIN", desc: "Toilet laki & perempuan", type: "mixed" },
  { id: "toilet-b", title: "TOILET - B", desc: "Toilet wanita", type: "wanita" },
];

export default function ChecksheetToiletListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [searchTerm, setSearchTerm] = useState("");
  const [redirected, setRedirected] = useState(false);

  const [areas, setAreas] = useState<AreaItem[]>(DEFAULT_AREAS);
  const [isLoading, setIsLoading] = useState(false);

  // Admin Area Management Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaItem | null>(null);
  const [modalForm, setModalForm] = useState({ id: "", title: "", desc: "", type: "mixed" });
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = !!(user && ["admin", "superadmin"].includes(user.role));

  const fetchMasterAreas = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/toilet-inspections/master?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && json.data.areas && Array.isArray(json.data.areas)) {
          setAreas(json.data.areas);
        }
      }
    } catch (e) {
      console.warn("Gagal load area toilet:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterAreas();
  }, []);

  useEffect(() => {
    if (redirected) return;
    if (!user || !isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, router, redirected]);

  const checkIfFilled = (areaId: string) => {
    if (typeof window === "undefined") return false;
    const key = `e-checksheet-toilet-${areaId}`;
    const saved = localStorage.getItem(key);
    if (!saved) return false;
    try {
      const data = JSON.parse(saved);
      if (Array.isArray(data)) {
        return !!data.find((entry: any) => entry.date === today);
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleOpenAdd = () => {
    setEditingArea(null);
    setModalForm({ id: "", title: "", desc: "", type: "mixed" });
    setShowAddModal(true);
  };

  const handleOpenEdit = (area: AreaItem) => {
    setEditingArea(area);
    setModalForm({ id: area.id, title: area.title, desc: area.desc, type: area.type || "mixed" });
    setShowAddModal(true);
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus lokasi toilet ini?")) return;
    try {
      const updated = areas.filter(a => a.id !== areaId);
      const res = await fetch("/api/toilet-inspections/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areas: updated, updated_by: user?.fullName || "admin" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Gagal menghapus area");
      setAreas(updated);
      alert("✅ Lokasi toilet berhasil dihapus!");
    } catch (err: any) {
      alert(`❌ Gagal menghapus: ${err.message}`);
    }
  };

  const handleSaveModalArea = async () => {
    if (!modalForm.title.trim()) {
      alert("Nama area toilet wajib diisi!");
      return;
    }

    try {
      setIsSaving(true);
      let updated: AreaItem[] = [];

      if (editingArea) {
        // Mode Edit
        updated = areas.map(a => {
          if (a.id === editingArea.id) {
            return {
              ...a,
              title: modalForm.title.trim().toUpperCase(),
              desc: modalForm.desc.trim(),
              type: modalForm.type,
            };
          }
          return a;
        });
      } else {
        // Mode Tambah
        const generatedId = modalForm.id.trim()
          ? modalForm.id.trim().toLowerCase().replace(/\s+/g, '-')
          : `toilet-${modalForm.title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        if (areas.some(a => a.id === generatedId)) {
          alert("ID atau Nama lokasi sudah ada, gunakan nama yang berbeda!");
          setIsSaving(false);
          return;
        }

        updated = [
          ...areas,
          {
            id: generatedId,
            title: modalForm.title.trim().toUpperCase(),
            desc: modalForm.desc.trim() || "Toilet",
            type: modalForm.type,
          }
        ];
      }

      const res = await fetch("/api/toilet-inspections/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areas: updated, updated_by: user?.fullName || "admin" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Gagal menyimpan area");

      setAreas(updated);
      setShowAddModal(false);
      alert(`✅ Lokasi toilet berhasil ${editingArea ? 'diperbarui' : 'ditambahkan'}!`);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAreas = areas.filter(area =>
    area.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

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
            Checksheet Toilet
          </div>

          <div className="header-subtitle">Daily check kebersihan dan kondisi toilet</div>
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
              <div style={{ fontWeight: "700", fontSize: "14px" }}>👑 Kelola Master Lokasi Toilet (Admin)</div>
              <div style={{ fontSize: "12px", color: "#bfdbfe" }}>
                Admin dapat menambah lokasi toilet baru, mengedit nama/zona, atau menghapus lokasi.
              </div>
            </div>
            <button
              onClick={handleOpenAdd}
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
              <Plus size={16} /> Tambah Lokasi Toilet
            </button>
          </div>
        )}

        {/* 🔍 Search Bar */}
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Cari lokasi toilet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Grid Area */}
        {filteredAreas.length === 0 ? (
          <div className="no-results">
            Tidak ada toilet ditemukan untuk "{searchTerm}"
          </div>
        ) : (
          <div className="categories-grid">
            {filteredAreas.map((area) => {
              const filled = checkIfFilled(area.id);
              return (
                <div key={area.id} className="category-card" style={{ position: "relative" }}>
                  <div className={`card-header ${filled ? "filled" : ""}`}>
                    <h2>{area.title}</h2>
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
                        onClick={() => handleOpenEdit(area)}
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
                        <Edit2 size={12} /> Edit
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
                      onClick={() => router.push(`/status-ga/checksheet-toilet/${area.id}`)}
                      className={`btn-checklist ${filled ? "btn-filled" : ""}`}
                    >
                      <FileText size={16} />
                      {filled ? "Sudah Diisi" : "Isi Checklist"}
                    </button>
                    <button
                      onClick={() => router.push(`/status-ga/checksheet-toilet/riwayat/${area.id}`)}
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

        {/* Modal Add / Edit Area */}
        {showAddModal && (
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
                  {editingArea ? "Edit Lokasi Toilet" : "Tambah Lokasi Toilet Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Nama Lokasi / Title
                  </label>
                  <input
                    type="text"
                    value={modalForm.title}
                    onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                    placeholder="Contoh: TOILET - KANTIN"
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

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Deskripsi / Zona
                  </label>
                  <input
                    type="text"
                    value={modalForm.desc}
                    onChange={(e) => setModalForm({ ...modalForm, desc: e.target.value })}
                    placeholder="Contoh: Toilet umum area kantin"
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

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Tipe Toilet
                  </label>
                  <select
                    value={modalForm.type}
                    onChange={(e) => setModalForm({ ...modalForm, type: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "14px",
                      background: "white",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="mixed">🚹🚺 Mixed (Laki &amp; Perempuan)</option>
                    <option value="wanita">🚺 Wanita (Female Only)</option>
                    <option value="general">🚻 General (Toilet Umum)</option>
                  </select>
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
                  onClick={() => setShowAddModal(false)}
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
                  onClick={handleSaveModalArea}
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
                  {isSaving ? "Menyimpan..." : "💾 Simpan Lokasi"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
          margin-bottom: 24px;
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
          outline: none;
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
          flex-shrink: 0;
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

        /* Grid Zona */
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
          padding: 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 2px solid #bbdefb;
        }

        .card-header.filled {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border-color: #c8e6c9;
        }

        .card-header h2 {
          margin: 0;
          font-size: 1.3rem;
          color: #0d47a1;
          font-weight: 700;
        }

        .card-desc {
          padding: 16px 20px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
          text-align: center;
        }

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
          text-decoration: none;
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

          .search-container {
            margin-top: 16px;
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