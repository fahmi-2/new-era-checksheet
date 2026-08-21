// app/status-ga/fire-alarm/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { AlertTriangle, FileText, BarChart2, QrCode, ArrowLeft } from "lucide-react";

export default function FireAlarmPage() {
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
  const checkIfFilled = (zona: string) => {
    if (typeof window === "undefined") return false;
    const key = `ga_fire_alarm_${zona}_${today}`;
    return localStorage.getItem(key) !== null;
  };

  const zones = [
    { id: "zona-1", title: "ZONA 1", desc: "Lobby, Hydrant Main Office" },
    { id: "zona-2", title: "ZONA 2", desc: "EXIM" },
    { id: "zona-3", title: "ZONA 3", desc: "Toilet C, Rest Area, Musholla, Pintu 1-2 Genba A" },
    { id: "zona-4", title: "ZONA 4", desc: "Office Warehouse, Lift Barang WHS, USM Area" },
    { id: "zona-5", title: "ZONA 5", desc: "Hydrant Jig Proto, Office Jig Proto" },
    { id: "zona-6", title: "ZONA 6", desc: "Hydrant Training" },
    { id: "zona-7", title: "ZONA 7", desc: "Hydrant Genba C, Dinding Mezzanine, Gel Sheet" },
    { id: "zona-8", title: "ZONA 8", desc: "Pump Room" },
    { id: "zona-9", title: "ZONA 9", desc: "Power House A, TPS B3" },
    { id: "zona-10", title: "ZONA 10", desc: "Hydrant Canteen" },
    { id: "zona-11", title: "ZONA 11", desc: "Auditorium" },
    { id: "zona-12", title: "ZONA 12", desc: "Samping Panel Genba B" },
    { id: "zona-13", title: "ZONA 13", desc: "Area Timur Genba B" },
    { id: "zona-14", title: "ZONA 14", desc: "Power House B, Parkir Bawah & Atas" },
    { id: "zona-15", title: "ZONA 15", desc: "Prepare Box EXIM, Office EXIM" },
    { id: "zona-20", title: "ZONA 20", desc: "Axis 8 - Selatan Pintu 7" },
    { id: "zona-22", title: "ZONA 22", desc: "New Warehouse" },
    { id: "zona-23", title: "ZONA 23", desc: "Bawah Mezzanine, Ministore Warehouse" },
  ];

  const filteredZones = zones.filter(zone =>
    zone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.desc.toLowerCase().includes(searchTerm.toLowerCase())
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
            Inspeksi Fire Alarm
          </div>

          <div className="header-subtitle">Daily check sistem alarm kebakaran</div>
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
        {filteredZones.length === 0 ? (
          <div className="no-results">
            Tidak ada zona ditemukan untuk "{searchTerm}"
          </div>
        ) : (
          <div className="categories-grid">
            {filteredZones.map((zone) => (
              <div key={zone.id} className="category-card">
                <div className={`card-header ${checkIfFilled(zone.id) ? "filled" : ""}`}>
                  <h2>{zone.title}</h2>
                </div>
                <p className="card-desc">{zone.desc}</p>
                <div className="card-actions">
                  {/* Tombol Isi Checklist */}
                  <button
                    onClick={() => router.push(`/status-ga/fire-alarm/${zone.id}?date=${today}`)}
                    className={`btn-checklist ${checkIfFilled(zone.id) ? "btn-filled" : ""}`}
                  >
                    <FileText size={16} />
                    {checkIfFilled(zone.id) ? "Sudah Diisi" : "Isi Checklist"}
                  </button>

                  {/* Tombol Riwayat */}
                  <button
                    onClick={() => router.push(`/status-ga/fire-alarm/riwayat/${zone.id}`)}
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

        /* Header Banner — DENGAN TOMBOL KEMBALI DI DALAM */
        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          padding: 16px 24px; /* Lebih kecil karena tombol kembali di dalam */
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px; /* Jarak antar elemen */
          position: relative;
        }

        /* Tombol Kembali — DI DALAM HEADER */
        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.2); /* Transparan putih */
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          text-decoration: none;
          outline: none;
          font-size: 0.9rem;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .btn-back span {
          font-size: 0.9rem;
        }

        .header-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1; /* Agar tetap di tengah jika ada ruang */
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

        /* ✅ TOMBOL DI DALAM CARD — MODERN & JELAS */
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