// app/status-ga/inspeksi-apar/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { AlertTriangle, FileText, BarChart2, ArrowLeft } from "lucide-react";

// Mapping area names (sama seperti di [slug]/page.tsx)
const areaNames: Record<string, string> = {
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

  // Validasi akses
  useEffect(() => {
    if (redirected) return;
    if (!user || !isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, redirected, router]);

  // ✅ Helper: Cek apakah area sudah diisi hari ini (opsional, untuk visual)
  const checkIfFilled = (slug: string) => {
    if (typeof window === "undefined") return false;
    const key = `ga_apar_${slug}_${today}`;
    return localStorage.getItem(key) !== null;
  };

  // ✅ Helper: Handle klik "Isi Checklist" - LANGSUNG KE FORM (tanpa cek scan di sini)
  // Validasi scan dilakukan di halaman form [slug]/page.tsx
  const handleChecklistClick = (slug: string) => {
    // Langsung navigasi ke form checksheet
    // Form akan menangani validasi scan via useScanVerification hook
    router.push(`/status-ga/inspeksi-apar/${slug}?date=${today}`);
  };

  if (!user) return null;

  // Build areas from mapping
  const areas = Object.entries(areaNames).map(([slug, title]) => ({
    id: slug,
    title: title,
    desc: `Inspeksi APAR - ${title}`,
  }));

  const filteredAreas = areas.filter(area =>
    area.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner - SAMA PERSIS FIRE ALARM */}
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

        {/* Grid Areas - SAMA PERSIS FIRE ALARM */}
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
                  </div>
                  <p className="card-desc">{area.desc}</p>

                  <div className="card-actions">
                    {/* ✅ TOMBOL ISI CHECKLIST - LANGSUNG KE FORM */}
                    <button
                      onClick={() => handleChecklistClick(area.id)}
                      className={`btn-checklist ${isFilled ? "btn-filled" : ""}`}
                    >
                      <FileText size={16} />
                      {isFilled ? "Sudah Diisi" : "Isi Checklist"}
                    </button>

                    {/* ✅ TOMBOL RIWAYAT - VIEW ONLY (tanpa scan) */}
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

        {/* Info Box - Petunjuk Penggunaan */}
        <div className="info-box" style={{ marginTop: '24px' }}>
          <h3>💡 Cara Penggunaan:</h3>
          <ul>
            <li>Klik <strong>"Isi Checklist"</strong> untuk membuka form inspeksi</li>
            <li>Form akan terbuka namun <strong>tidak dapat diisi</strong> sebelum scan QR code area</li>
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