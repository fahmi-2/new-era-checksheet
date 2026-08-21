"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react"; // ✅ Import icon ArrowLeft

type InspectionItem = {
  id: string;
  label: string;
  imageKey?: string;
};

const inspectionItems: InspectionItem[] = [
  { id: "1", label: "PONDASI / BAUT PENGIKAT", imageKey: "pondasi" },
  { id: "2", label: "KOLOM / RANGKA", imageKey: "kolom-rangka" },
  { id: "3", label: "SANGKAR", imageKey: "sangkar" },
  { id: "4", label: "BEAM DUDUKAN MOTOR HOIST", imageKey: "beam-dudukan-motor-hoist" },
  { id: "5", label: "REL PEMANDU", imageKey: "rel-pemandu" },
  { id: "6", label: "RODA PENGGERAK (NAIK - TURUN)", imageKey: "roda-penggerak" },
  { id: "7", label: "RODA IDLE", imageKey: "roda-idle" },
  { id: "8", label: "PEREDAM / PENYANGGA", imageKey: "peredam-penyangga" },
  { id: "9", label: "MOTOR HOIST & GEAR BOX", imageKey: "motor-hoist-gear-box" },
  { id: "10", label: "PULLY / CAKRA", imageKey: "pully-cakra" },
  { id: "11", label: "KAIT UTAMA", imageKey: "kait-utama" },
  { id: "12", label: "TALI KABEL BAJA", imageKey: "tali-kabel-baja" },
  { id: "13", label: "TOMBOL PUSH BUTTON", imageKey: "tombol-push-button" },
  { id: "14", label: "SAFETY DEVICE", imageKey: "safety-device" },
  { id: "15", label: "KOMPONEN LISTRIK", imageKey: "komponen-listrik" },
  { id: "16", label: "KETERSEDIAAN APAR DI DEKAT LIFT", imageKey: "apar" },
];

export default function InspeksiLiftBarangListPage() {
  const router = useRouter();
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [imageLabel, setImageLabel] = useState<string>("");

  useEffect(() => {
    if (redirected) return;
    if (!user) return;
    if (!isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, router, redirected]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (!isAuthorizedForChecksheet(user)) {
    return null;
  }

  const handleInputClick = (itemId: string) => {
    router.push(`/status-ga/inspeksi-preventif-lift-barang/inspeksi/form/${itemId}`);
  };

  const handleHistoryClick = (itemId: string) => {
    router.push(`/status-ga/inspeksi-preventif-lift-barang/inspeksi/riwayat/${itemId}`);
  };

  const openImage = (item: InspectionItem) => {
    if (!item.imageKey) return;
    const ext = item.imageKey === "tali-kabel-baja" ? "png" : "jpg";
    const src = `/images/lift-barang/${item.imageKey}.${ext}`;
    setFullImage(src);
    setImageLabel(item.label);
  };

  const closeImage = () => {
    setFullImage(null);
    setImageLabel("");
  };

  // Tutup modal dengan tombol Esc
  useEffect(() => {
    if (redirected) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* ✅ Header dengan Tombol Kembali */}
        <div className="header">
          <div className="header-left">
            <button
              onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang")}
              className="btn-back"
              aria-label="Kembali ke halaman sebelumnya"
            >
              <ArrowLeft size={18} />
              <span>Kembali</span>
            </button>
          </div>
          
          <div className="header-center">
            <h1>📋 A. Inspeksi Lift Barang (3 Bulanan)</h1>
            <p className="subtitle">Ringkasan item inspeksi — klik "Input" untuk mengisi</p>
          </div>
        </div>

        <table className="summary-table">
          <thead>
            <tr>
              <th>Nama Item</th>
              <th>Gambar</th>
              <th>Keterangan</th>
              <th>Aksi</th>
              <th>Riwayat</th>
            </tr>
          </thead>
          <tbody>
            {inspectionItems.map((item) => (
              <tr key={item.id}>
                <td>{item.label}</td>
                <td>
  {item.imageKey && (
    <div className="image-wrapper" onClick={() => openImage(item)}>
      <img
        src={`/images/lift-barang/${item.imageKey}.${item.imageKey === "tali-kabel-baja" ? "png" : "jpg"}`}
        alt={item.label}
        className="thumb"
      />
    </div>
  )}
</td>
                <td>-</td>
                <td>
                  <button
                    className="btn-action"
                    onClick={() => handleInputClick(item.id)}
                  >
                    Input
                  </button>
                </td>
                <td>
                  <button
                    className="btn-history"
                    onClick={() => handleHistoryClick(item.id)}
                  >
                    Riwayat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Full Image */}
      {fullImage && (
        <div className="modal-overlay" onClick={closeImage}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{imageLabel}</h3>
            <img src={fullImage} alt={imageLabel} className="modal-image" />
          </div>
        </div>
      )}

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        
        /* ✅ Header Layout */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          gap: 24px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
        }
        
        .header-center {
          flex: 1;
        }
        
        /* ✅ Tombol Kembali */
        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .btn-back:active {
          transform: translateY(0);
        }
        
        .header h1 {
          color: #ffffff;
          margin-bottom: 8px;
          font-size: 1.8rem;
          margin: 0;
        }
        .subtitle {
          color: #ffffff;
          margin-bottom: 0;
          font-size: 1rem;
        }
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .summary-table th,
        .summary-table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .summary-table th {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          font-weight: 600;
          color: #0d47a1;
        }
        .summary-table tbody tr {
          transition: background-color 0.2s ease;
        }
        .summary-table tbody tr:hover {
          background-color: #f5f5f5;
        }
        .thumb {
          width: 120px;
          height: 90px;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid #e0e0e0;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .thumb:hover {
          transform: scale(1.05);
          border-color: #1e88e5;
        }

        .btn-action,
        .btn-history {
          padding: 8px 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .btn-action {
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
        }
        .btn-action:hover {
          box-shadow: 0 2px 6px rgba(30, 136, 229, 0.4);
          transform: translateY(-2px);
        }
        .btn-action:active {
          transform: translateY(0);
        }
        .btn-history {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        .btn-history:hover {
          background: #e8e8e8;
          border-color: #999;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 10px;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .modal-content h3 {
          margin: 0 0 12px 0;
          color: #0d47a1;
          font-size: 1.2rem;
          text-align: center;
        }
        .modal-image {
          max-width: 80vw;
          max-height: 70vh;
          object-fit: contain;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
          /* Sesuaikan lebar kolom */
.summary-table th:nth-child(2),
.summary-table td:nth-child(2) {
  width: 180px; /* atau min-width */
  padding: 8px;
}

.image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px; /* batas tinggi */
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #f9f9f9;
  cursor: pointer;
  transition: border-color 0.2s;
}

.image-wrapper:hover {
  border-color: #1e88e5;
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: contain; /* agar seluruh gambar terlihat, tanpa crop */
  transition: transform 0.2s;
}

.image-wrapper:hover .thumb {
  transform: scale(1.05);
}

/* ✅ Responsive untuk mobile */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-left {
    width: 100%;
  }
  
  .btn-back {
    width: fit-content;
    padding: 6px 12px;
    font-size: 0.85rem;
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
  
  .summary-table {
    display: block;
    overflow-x: auto;
  }
  
  .summary-table th,
  .summary-table td {
    padding: 10px 12px;
    font-size: 0.85rem;
  }
  
  .btn-action,
  .btn-history {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
}
      `}</style>
    </div>
  );
}