// app/inspeksi-emergency/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { AlertTriangle, FileText, BarChart2, ArrowLeft } from "lucide-react";

export default function InspeksiEmergencyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [searchTerm, setSearchTerm] = useState("");
  const [redirected, setRedirected] = useState(false);

  // Validasi akses
  useEffect(() => {
    if (redirected) return;

    if (!user || !isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, redirected, router]);

  // Cek apakah sudah diisi hari ini
  const checkIfFilled = (area: string) => {
    if (typeof window === "undefined") return false;
    const key = `ga_emergency_${area}_${today}`;
    return localStorage.getItem(key) !== null;
  };

  const areas = [
    { id: "genba-a", title: "ZONA 1", desc: "Lobby, Hydrant Main Office" },
    { id: "genba-b", title: "ZONA 2", desc: "EXIM" },
    { id: "genba-c", title: "ZONA 3", desc: "Toilet C, Rest Area, Musholla, Pintu 1-2 Genba A" },
    { id: "jig-proto", title: "ZONA 4", desc: "Office Warehouse, Lift Barang WHS, USM Area" },
    { id: "gel-sheet", title: "ZONA 5", desc: "Hydrant Jig Proto, Office Jig Proto" },
    { id: "warehouse", title: "ZONA 6", desc: "Hydrant Training" },
    { id: "mezzanine", title: "ZONA 7", desc: "Mezzanine Genba A, Genba B" },
    { id: "parkir", title: "ZONA 8", desc: "Parkir Motor, Parkir Mobil" },
    { id: "main-office", title: "ZONA 9", desc: "Main Office, Lobby Utama" },
  ];

  const filteredAreas = areas.filter(area =>
    area.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner — DENGAN TOMBOL KEMBALI DI DALAMNYA */}
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
            Inspeksi Emergency Lamp
          </div>

          <div className="header-subtitle">Daily check sistem pencahayaan darurat</div>
        </div>

        {/* 🔍 Search Bar */}
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Cari zona atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Grid Zona */}
        {filteredAreas.length === 0 ? (
          <div className="no-results">
            Tidak ada zona ditemukan untuk "{searchTerm}"
          </div>
        ) : (
          <div className="categories-grid">
            {filteredAreas.map((area) => (
              <div key={area.id} className="category-card">
                <div className={`card-header ${checkIfFilled(area.id) ? "filled" : ""}`}>
                  <h2>{area.title}</h2>
                </div>
                <p className="card-desc">{area.desc}</p>
                <div className="card-actions">
                  {/* Tombol Isi Checklist */}
                  <button
                    onClick={() => router.push(`/status-ga/inspeksi-emergency/${area.id}?date=${today}`)}
                    className={`btn-checklist ${checkIfFilled(area.id) ? "btn-filled" : ""}`}
                  >
                    <FileText size={16} />
                    {checkIfFilled(area.id) ? "Sudah Diisi" : "Isi Checklist"}
                  </button>

                  {/* Tombol Riwayat */}
                  <button
                    onClick={() => router.push(`/status-ga/inspeksi-emergency/riwayat/${area.id}`)}
                    className="btn-riwayat"
                  >
                    <BarChart2 size={16} />
                    Riwayat
                  </button>
                </div>
              </div>
            ))}
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
          position: relative;
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
        }

        /* Tombol */
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