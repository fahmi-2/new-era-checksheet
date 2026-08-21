// app/status-ga/inspeksi-preventif-lift-barang/inspeksi/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

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
  const { user } = useAuth();
  const [redirected, setRedirected] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [imageLabel, setImageLabel] = useState<string>("");

  // ✅ Define helper function SEBELUM digunakan di hooks
  const closeImage = () => {
    setFullImage(null);
    setImageLabel("");
  };

  // ✅ useEffect untuk escape key - HARUS DI ATAS SEBELUM RETURN
  useEffect(() => {
    if (redirected) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redirected]);

  // ✅ useEffect untuk redirect logic - HARUS DI ATAS SEBELUM RETURN
  useEffect(() => {
    if (redirected) return;
    if (!user) return;
    if (!isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, router, redirected]);

  // ✅ EARLY RETURN SETELAH SEMUA HOOKS
  if (!user) {
    return <div>Loading...</div>;
  }

  if (!isAuthorizedForChecksheet(user)) {
    return null;
  }

  // ✅ Helper functions (bukan hooks) - BISA DI SINI SETELAH RETURN
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

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <h1>📋 A. Inspeksi Lift Barang (3 Bulanan)</h1>
          <p className="subtitle">Ringkasan item inspeksi — klik "Input" untuk mengisi</p>
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
    </div>
  );
}
