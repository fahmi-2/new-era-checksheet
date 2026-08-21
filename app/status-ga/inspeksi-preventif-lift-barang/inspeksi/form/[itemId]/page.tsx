"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { QrCode } from "lucide-react";

// ✅ TAMBAHKAN IMPORT HOOK SCAN VERIFICATION
import { useScanVerification } from "@/lib/hooks/useScanVerification";

type SubItem = {
  id: string;
  label: string;
  method: "VISUAL" | "DICOBA";
};

const inspectionData: Record<string, { title: string; imageKey?: string; subItems: SubItem[] }> = {
  "1": {
    title: "PONDASI / BAUT PENGIKAT",
    imageKey: "pondasi",
    subItems: [
      { id: "1A", label: "KOROSI", method: "VISUAL" },
      { id: "1B", label: "KERETAKAN", method: "VISUAL" },
      { id: "1C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
    ],
  },
  "2": {
    title: "KOLOM / RANGKA",
    imageKey: "kolom-rangka",
    subItems: [
      { id: "2A", label: "KOROSI", method: "VISUAL" },
      { id: "2B", label: "KERETAKAN", method: "VISUAL" },
      { id: "2C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "2D", label: "PENGIKATAN", method: "VISUAL" },
      { id: "2E", label: "PENGUAT", method: "VISUAL" },
      { id: "2F", label: "MELINTANG", method: "VISUAL" },
    ],
  },
  "3": {
    title: "SANGKAR",
    imageKey: "sangkar",
    subItems: [
      { id: "3A", label: "PAGAR PENGAMANAN", method: "VISUAL" },
      { id: "3B", label: "PINTU", method: "VISUAL" },
      { id: "3C", label: "LANTAI KERJA", method: "VISUAL" },
      { id: "3D", label: "PENGUNCI PINTU", method: "VISUAL" },
      { id: "3E", label: "PENERANGAN", method: "DICOBA" },
      { id: "3F", label: "SIRINE / ROTARY LAMP SIGNAL", method: "DICOBA" },
      { id: "3G", label: "TANDA BATAS MAKSIMUM PENGANGKATAN", method: "VISUAL" },
      { id: "3H", label: "TANDA PENGOPERASIAN", method: "VISUAL" },
      { id: "3I", label: "KEBERSIHAN SANGKAR", method: "VISUAL" },
    ],
  },
  "4": {
    title: "BEAM DUDUKAN MOTOR HOIST",
    imageKey: "beam-dudukan-motor-hoist",
    subItems: [
      { id: "4A", label: "KOROSI", method: "VISUAL" },
      { id: "4B", label: "KERETAKAN", method: "VISUAL" },
      { id: "4C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "4D", label: "PENGIKATAN", method: "VISUAL" },
    ],
  },
  "5": {
    title: "REL PEMANDU",
    imageKey: "rel-pemandu",
    subItems: [
      { id: "5A", label: "KOROSI", method: "VISUAL" },
      { id: "5B", label: "KERETAKAN", method: "VISUAL" },
      { id: "5C", label: "SAMBUNGAN REL", method: "VISUAL" },
      { id: "5D", label: "KELURUSAN REL", method: "VISUAL" },
      { id: "5F", label: "KERATAAN REL", method: "VISUAL" },
    ],
  },
  "6": {
    title: "RODA PENGGERAK (NAIK - TURUN)",
    imageKey: "roda-penggerak",
    subItems: [
      { id: "6A", label: "KEAUSAN", method: "VISUAL" },
      { id: "6B", label: "KERETAKAN", method: "VISUAL" },
      { id: "6C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "6D", label: "KONDISI BEARING", method: "VISUAL" },
    ],
  },
  "7": {
    title: "RODA IDLE",
    imageKey: "roda-idle",
    subItems: [
      { id: "7A", label: "KEAUSAN", method: "VISUAL" },
      { id: "7B", label: "KERETAKAN", method: "VISUAL" },
      { id: "7C", label: "PERUBAHAN BENTUK", method: "VISUAL" },
      { id: "7D", label: "KONDISI FLENS", method: "VISUAL" },
    ],
  },
  "8": {
    title: "PEREDAM / PENYANGGA",
    imageKey: "peredam-penyangga",
    subItems: [
      { id: "8A", label: "BANTALAN KARET", method: "VISUAL" },
      { id: "8B", label: "LAYAK DIPAKAI", method: "VISUAL" },
      { id: "8C", label: "SESUAI DI LAYOUT", method: "VISUAL" },
    ],
  },
  "9": {
    title: "MOTOR HOIST & GEAR BOX",
    imageKey: "motor-hoist-gear-box",
    subItems: [
      { id: "9A", label: "KEAUSAN", method: "VISUAL" },
      { id: "9B", label: "PENYETELAN", method: "VISUAL" },
    ],
  },
  "10": {
    title: "PULLY / CAKRA (UTAMA, TAMBAHAN, PENGHANTAR)",
    imageKey: "pully-cahra",
    subItems: [
      { id: "10A", label: "ALUR PULLY", method: "VISUAL" },
      { id: "10B", label: "BIBIR PULLY", method: "VISUAL" },
      { id: "10C", label: "PIN PULLY", method: "VISUAL" },
      { id: "10D", label: "BANTALAN PULLY", method: "VISUAL" },
      { id: "10E", label: "PELINDUNG PULLY", method: "VISUAL" },
      { id: "10F", label: "PENGHADANG TALI KAWAT BAJA", method: "VISUAL" },
    ],
  },
  "11": {
    title: "KAIT UTAMA",
    imageKey: "kait-utama",
    subItems: [
      { id: "11A", label: "KEAUSAN", method: "VISUAL" },
      { id: "11B", label: "KERENGGANGAN MULUT KAIT", method: "VISUAL" },
      { id: "11C", label: "MUR DAN BANTALAN PUTAR (SWIFEL)", method: "VISUAL" },
      { id: "11D", label: "TRUNION", method: "VISUAL" },
      { id: "11E", label: "KUNCI KAIT", method: "VISUAL" },
      { id: "11F", label: "KERETAKAN HOOK", method: "VISUAL" },
    ],
  },
  "12": {
    title: "TALI KABEL BAJA",
    imageKey: "tali-kabel-baja",
    subItems: [
      { id: "12A", label: "KOROSI", method: "VISUAL" },
      { id: "12B", label: "KEAUSAN", method: "VISUAL" },
      { id: "12C", label: "PUTUS", method: "VISUAL" },
    ],
  },
  "13": {
    title: "TOMBOL PUSH BUTTON",
    imageKey: "tombol-push-button",
    subItems: [
      { id: "13A", label: "TOMBOL ANGKAT (GERAKAN ANGKAT)", method: "DICOBA" },
      { id: "13B", label: "TOMBOL TURUN (GERAKAN PENURUNAN)", method: "DICOBA" },
      { id: "13C", label: "TOMBOL EMERGENCY STOP", method: "DICOBA" },
      { id: "13D", label: "TANDA-TANDA PENGOPERASIAN", method: "VISUAL" },
    ],
  },
  "14": {
    title: "SAFETY DEVICE",
    imageKey: "safety-device",
    subItems: [
      { id: "14A", label: "LIMIT SWITCH PINTU", method: "DICOBA" },
      { id: "14B", label: "LIMIT SWITCH PENGAMAN", method: "DICOBA" },
      { id: "14C", label: "LIMIT SWITCH FINAL UP/DOWN", method: "DICOBA" },
      { id: "14D", label: "LIMIT SWITCH UP", method: "DICOBA" },
      { id: "14E", label: "LIMIT SWITCH DOWN", method: "DICOBA" },
      { id: "14F", label: "EMERGENCY STOP", method: "DICOBA" },
      { id: "14G", label: "DROP SAFETY DEVICE / SAFETY LATCH", method: "DICOBA" },
    ],
  },
  "15": {
    title: "KOMPONEN LISTRIK",
    imageKey: "komponen-listrik",
    subItems: [
      { id: "15A", label: "PENYAMBUNG PENGHANTAR PANEL", method: "VISUAL" },
      { id: "15B", label: "PELINDUNG PENGHANTAR", method: "VISUAL" },
      { id: "15C", label: "SISTEM PENGAMAN INSTALASI DARI MOTOR", method: "VISUAL" },
      { id: "15D", label: "INSTALASI", method: "VISUAL" },
      { id: "15E", label: "KUNCI PANEL", method: "VISUAL" },
    ],
  },
  "16": {
    title: "KETERSEDIAAN APAR DI DEKAT LIFT",
    imageKey: "apar",
    subItems: [{ id: "16A", label: "ALAT PEMADAM API RINGAN (APAR)", method: "VISUAL" }],
  },
};

type FormData = Record<
  string,
  {
    status: "OK" | "NG";
    keterangan?: string;
    solusi?: string;
    foto_path?: string;
  }
>;

export default function InspeksiFormDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isOnline, pendingCount } = useConnection();
  
  // ✅ TAMBAHKAN HOOK INI - WAJIB DI TOP LEVEL
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  
  const [redirected, setRedirected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const itemId = params?.itemId as string | undefined;
  const viewId = searchParams?.get("view") || null;

  if (!itemId) {
    return <div>Loading item...</div>;
  }

  const item = inspectionData[itemId];
  if (!item) {
    return <div>Item tidak ditemukan</div>;
  }

  const [formData, setFormData] = useState<FormData>({});
  const [isViewMode, setIsViewMode] = useState(false);

  // Inisialisasi formData
  useEffect(() => {
    const initialData: FormData = {};
    item.subItems.forEach(sub => {
      initialData[sub.id] = {
        status: "OK",
        keterangan: "",
        solusi: "",
        foto_path: "",
      };
    });
    setFormData(initialData);
  }, [itemId]);

  // Load data for view mode
  useEffect(() => {
    if (viewId && itemId) {
      setIsViewMode(true);
      fetch(`/e-checksheet-ga/api/lift-barang/inspeksi/history?itemId=${itemId}`)
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data.length > 0) {
            const inspection = result.data.find((entry: any) => entry.id === viewId);
            if (inspection) {
              const loadedData: FormData = {};
              item.subItems.forEach(sub => {
                const itemData = inspection.data[sub.id];
                loadedData[sub.id] = {
                  status: itemData?.status || "OK",
                  keterangan: itemData?.keterangan || "",
                  solusi: itemData?.solusi || "",
                  foto_path: itemData?.foto_path || "",
                };
              });
              setFormData(loadedData);
            }
          }
        })
        .catch(error => {
          console.error('Error loading inspection data:', error);
        });
    } else {
      setIsViewMode(false);
    }
  }, [viewId, itemId, item.subItems]);

  // Toggle expand for mobile card view
  const toggleExpand = (subId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  const handleStatusChange = (subId: string, status: "OK" | "NG") => {
    setFormData((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        status,
        keterangan: status === "OK" ? "" : prev[subId]?.keterangan || "",
        solusi: status === "OK" ? "" : prev[subId]?.solusi || "",
      },
    }));
  };

  const handleInputChange = (subId: string, field: "keterangan" | "solusi", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        [field]: value,
      },
    }));
  };

  // ✅ UPLOAD FOTO MENGGUNAKAN BASE64 (KONSISTEN DENGAN OFFLINE MODE)
  const handleImageUpload = (subId: string, e: ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        [subId]: { 
          ...prev[subId], 
          foto_path: reader.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (isViewMode) return;

    try {
      setLoading(true);

      const validatedData: Record<string, any> = {};
      let hasValidItems = false;

      for (const sub of item.subItems) {
        const entry = formData[sub.id];
        
        if (!entry || typeof entry !== 'object') {
          console.warn(`Item ${sub.id} tidak valid atau undefined`);
          continue;
        }

        const status = entry.status === 'NG' ? 'NG' : 'OK';
        
        if (status === 'NG') {
          const keterangan = (entry.keterangan || '').trim();
          const solusi = (entry.solusi || '').trim();
          
          if (!keterangan || !solusi) {
            alert(`❗ Item ${sub.id}: Keterangan dan solusi wajib diisi untuk kondisi NG!`);
            return;
          }
          
          validatedData[sub.id] = {
            status: 'NG',
            keterangan: keterangan,
            solusi: solusi,
            foto_path: entry.foto_path || null
          };
        } else {
          validatedData[sub.id] = {
            status: 'OK',
            keterangan: '',
            solusi: '',
            foto_path: entry.foto_path || null
          };
        }
        
        hasValidItems = true;
      }

      if (!hasValidItems) {
        alert('❗ Tidak ada item yang valid untuk disimpan!');
        return;
      }

      const submitData = {
        itemId,
        inspection_date: new Date().toISOString().split('T')[0],
        inspector: user?.fullName || 'Unknown Inspector',
        inspector_nik: user?.nik || '',
        data: validatedData
      };

      console.log('📤 Data yang akan dikirim ke API:', {
        itemId: submitData.itemId,
        inspection_date: submitData.inspection_date,
        inspector: submitData.inspector,
        data_count: Object.keys(submitData.data).length,
        sample_item: submitData.data[Object.keys(submitData.data)[0]]
      });

      // ✅ PENGGUNAAN SMARTFETCH UNTUK OFFLINE MODE
      const response = await smartFetch('/e-checksheet-ga/api/lift-barang/inspeksi/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
        queueType: 'lift_barang_inspeksi',
        metadata: { itemId: itemId }
      });

      const result = await response.json();
      console.log('📥 Response dari API:', result);

      if (response.ok && result.success) {
        alert("✅ Data berhasil disimpan!");
        router.push("/status-ga/inspeksi-preventif-lift-barang/inspeksi");
      } else {
        const errorMsg = result.message || result.error || 'Gagal menyimpan data';
        alert(`❌ ${errorMsg}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert("❌ Terjadi kesalahan saat menyimpan data: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function untuk mendapatkan URL gambar (mendukung base64 dan path server)
  const getImageUrl = (fotoPath: string) => {
    if (!fotoPath) return '';
    if (fotoPath.startsWith('data:') || fotoPath.startsWith('http')) {
      return fotoPath;
    }
    return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${fotoPath}`;
  };

  return (
    <div className="app-page">
      <Sidebar userName={user?.fullName || 'Unknown User'} />

      <div className="page-content">
        <button
          onClick={() => router.back()}
          className="back-btn"
        >
          ← Kembali ke Daftar
        </button>

        <h1>
          {isViewMode ? "👁️‍🗨️ Detail Riwayat: " : "📋 Inspeksi: "}
          {item.title}
        </h1>
        
        {/* ✅ SCAN WARNING BANNER - TAMBAHAN BARU */}
        {!isScanned && !isViewMode && (
          <div className="banner banner-warning scan-warning">
            <span>🔒 Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.</span>
            <button 
              onClick={() => router.push("/scan")} 
              className="banner-btn"
              disabled={loading}
            >
              <QrCode size={14} /> Scan Sekarang
            </button>
          </div>
        )}
        
        {item.imageKey && (
          <div className="ref-image">
            <img
              src={`/images/lift-barang/${item.imageKey}.${item.imageKey === "tali-kabel-baja" ? "png" : "jpg"}`}
              alt={item.title}
            />
            <p><em>Gambar referensi</em></p>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Memproses...</p>
          </div>
        )}

        {/* ✅ DESKTOP: Table View */}
        <div className="desktop-view">
          <table className="form-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Sub-Item</th>
                <th>Metode</th>
                <th>Status</th>
                {isViewMode && <th>Foto</th>}
                {!isViewMode && <th>Keterangan (jika NG)</th>}
                {!isViewMode && <th>Solusi (jika NG)</th>}
                {!isViewMode && <th>Foto Hasil</th>}
                {isViewMode && <th>Keterangan & Solusi</th>}
              </tr>
            </thead>
            <tbody>
              {item.subItems.map((sub, idx) => {
                const entry = formData[sub.id];
                return (
                  <tr key={sub.id}>
                    <td>{String.fromCharCode(65 + idx)}.</td>
                    <td>{sub.label}</td>
                    <td>{sub.method}</td>
                    <td>
                      {isViewMode ? (
                        <span className={entry?.status === "NG" ? "status-ng" : "status-ok"}>
                          {entry?.status || "-"}
                        </span>
                      ) : (
                        <div className="radio-group">
                          <label title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                            <input
                              type="radio"
                              name={`status-${sub.id}`}
                              checked={entry?.status === "OK"}
                              onChange={() => handleStatusChange(sub.id, "OK")}
                              disabled={isViewMode || loading || !isScanned}
                            /> OK
                          </label>
                          <label title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                            <input
                              type="radio"
                              name={`status-${sub.id}`}
                              checked={entry?.status === "NG"}
                              onChange={() => handleStatusChange(sub.id, "NG")}
                              disabled={isViewMode || loading || !isScanned}
                            /> NG
                          </label>
                        </div>
                      )}
                    </td>
                    
                    {isViewMode && (
                      <td>
                        {entry?.foto_path ? (
                          <div className="image-preview">
                            <img 
                              src={getImageUrl(entry.foto_path)}
                              alt="Foto inspeksi" 
                              className="uploaded-image" 
                            />
                          </div>
                        ) : (
                          <span className="no-photos">Tidak ada foto</span>
                        )}
                      </td>
                    )}
                    
                    {!isViewMode && (
                      <>
                        <td>
                          {entry?.status === "NG" && (
                            <textarea
                              placeholder="Jelaskan kondisi NG..."
                              value={entry.keterangan || ""}
                              onChange={(e) => handleInputChange(sub.id, "keterangan", e.target.value)}
                              className="text-input"
                              disabled={isViewMode || loading || !isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            />
                          )}
                        </td>
                        <td>
                          {entry?.status === "NG" && (
                            <textarea
                              placeholder="Usulan solusi/perbaikan..."
                              value={entry.solusi || ""}
                              onChange={(e) => handleInputChange(sub.id, "solusi", e.target.value)}
                              className="text-input"
                              disabled={isViewMode || loading || !isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            />
                          )}
                        </td>
                        <td>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(sub.id, e)}
                            disabled={isViewMode || loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            className="file-input"
                          />
                          {entry?.foto_path && (
                            <div className="image-preview">
                              <img 
                                src={getImageUrl(entry.foto_path)}
                                alt="Preview" 
                                className="uploaded-image" 
                              />
                            </div>
                          )}
                        </td>
                      </>
                    )}
                    
                    {isViewMode && (
                      <td>
                        {entry?.status === "NG" ? (
                          <div>
                            <div><strong>Keterangan:</strong> {entry.keterangan || "-"}</div>
                            <div><strong>Solusi:</strong> {entry.solusi || "-"}</div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ✅ MOBILE: Card View */}
        <div className="mobile-view">
          {item.subItems.map((sub, idx) => {
            const entry = formData[sub.id];
            const isExpanded = expandedItems[sub.id] || false;
            
            return (
              <div key={sub.id} className="inspection-card">
                <div 
                  className="card-header"
                  onClick={() => toggleExpand(sub.id)}
                >
                  <div className="card-no">{String.fromCharCode(65 + idx)}.</div>
                  <div className="card-info">
                    <div className="card-label">{sub.label}</div>
                    <div className="card-method">{sub.method}</div>
                  </div>
                  <div className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                    {isExpanded ? '▲' : '▼'}
                  </div>
                </div>

                {isExpanded && (
                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      {isViewMode ? (
                        <span className={entry?.status === "NG" ? "status-ng" : "status-ok"}>
                          {entry?.status || "-"}
                        </span>
                      ) : (
                        <div className="radio-group-mobile">
                          <label className={`radio-label ${!isScanned ? 'disabled' : ''}`}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                            <input
                              type="radio"
                              name={`status-mobile-${sub.id}`}
                              checked={entry?.status === "OK"}
                              onChange={() => handleStatusChange(sub.id, "OK")}
                              disabled={isViewMode || loading || !isScanned}
                            />
                            <span className="radio-text ok">OK</span>
                          </label>
                          <label className={`radio-label ${!isScanned ? 'disabled' : ''}`}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                            <input
                              type="radio"
                              name={`status-mobile-${sub.id}`}
                              checked={entry?.status === "NG"}
                              onChange={() => handleStatusChange(sub.id, "NG")}
                              disabled={isViewMode || loading || !isScanned}
                            />
                            <span className="radio-text ng">NG</span>
                          </label>
                        </div>
                      )}
                    </div>

                    {!isViewMode && entry?.status === "NG" && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Keterangan</label>
                          <textarea
                            placeholder="Jelaskan kondisi NG..."
                            value={entry.keterangan || ""}
                            onChange={(e) => handleInputChange(sub.id, "keterangan", e.target.value)}
                            className="text-input-mobile"
                            disabled={isViewMode || loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Solusi</label>
                          <textarea
                            placeholder="Usulan solusi/perbaikan..."
                            value={entry.solusi || ""}
                            onChange={(e) => handleInputChange(sub.id, "solusi", e.target.value)}
                            className="text-input-mobile"
                            disabled={isViewMode || loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Foto</label>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(sub.id, e)}
                            disabled={isViewMode || loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                            className="file-input-mobile"
                          />
                          {entry?.foto_path && (
                            <div className="image-preview-mobile">
                              <img 
                                src={getImageUrl(entry.foto_path)}
                                alt="Preview" 
                                className="uploaded-image-mobile" 
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {isViewMode && (
                      <>
                        {entry?.foto_path && (
                          <div className="form-group">
                            <label className="form-label">Foto</label>
                            <div className="image-preview-mobile">
                              <img 
                                src={getImageUrl(entry.foto_path)}
                                alt="Foto inspeksi" 
                                className="uploaded-image-mobile" 
                              />
                            </div>
                          </div>
                        )}
                        
                        {entry?.status === "NG" && (
                          <>
                            <div className="form-group">
                              <label className="form-label">Keterangan</label>
                              <p className="view-text">{entry.keterangan || "-"}</p>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Solusi</label>
                              <p className="view-text">{entry.solusi || "-"}</p>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isViewMode && (
          <div className="actions">
            <button 
              onClick={handleSubmit} 
              className="btn-primary"
              disabled={loading || !isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
            >
              {loading ? 'Menyimpan...' : 'Simpan Hasil'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          background: #fafafa;
          width: 100%;
        }

        .back-btn {
          background: white;
          border: 1.5px solid #e0e0e0;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 24px;
          font-weight: 600;
          color: #1565c0;
          transition: all 0.3s ease;
          min-height: 44px;
        }

        .back-btn:hover {
          background: #f5f5f5;
          border-color: #1565c0;
          transform: translateX(-2px);
          box-shadow: 0 2px 6px rgba(21, 101, 192, 0.15);
        }

        h1 {
          color: #0d47a1;
          margin: 16px 0 24px 0;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .ref-image {
          text-align: center;
          margin: 24px 0;
          padding: 20px;
          background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          border-radius: 12px;
          border: 1px solid #bbdefb;
        }

        .ref-image img {
          max-height: 280px;
          max-width: 100%;
          border: 2px solid #90caf9;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 4px 12px rgba(66, 133, 244, 0.15);
        }

        .ref-image p {
          color: #512da8;
          margin: 0;
          font-weight: 500;
        }

        /* ── Banners ────────────────────────────────────── */
        .banner {
          border-radius: 10px; padding: 12px 18px; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px; font-weight: 500;
        }
        .banner-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b; color: #92400e;
          box-shadow: 0 2px 8px rgba(245,158,11,0.12);
        }
        .banner-btn {
          margin-left: auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white; border: none; border-radius: 7px; padding: 8px 16px;
          cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(245,158,11,0.3);
          display: inline-flex; align-items: center; gap: 6px; min-height: 36px;
        }
        .banner-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(245,158,11,0.4); }
        .banner-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .scan-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b; justify-content: space-between;
        }
        .scan-warning .banner-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          padding: 8px 16px;
        }
        .scan-warning .banner-btn:hover {
          transform: translateY(-1px); box-shadow: 0 4px 10px rgba(124, 58, 237, 0.4);
        }

        /* Desktop View */
        .desktop-view {
          display: block;
        }

        .mobile-view {
          display: none;
        }

        .form-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .form-table th,
        .form-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
        }

        .form-table th {
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          font-weight: 600;
          color: white;
        }

        .form-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .form-table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .radio-group {
          display: flex;
          gap: 20px;
        }

        .radio-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #424242;
          cursor: pointer;
        }

        .radio-group label.disabled {
          color: #999;
          cursor: not-allowed;
        }

        .radio-group input[type="radio"] {
          cursor: pointer;
          width: 20px;
          height: 20px;
          accent-color: #1e88e5;
        }

        .radio-group input[type="radio"]:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .text-input {
          width: 100%;
          min-height: 80px;
          padding: 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.95rem;
          color: #333;
          transition: all 0.3s ease;
        }

        .text-input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }

        .text-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          color: #999;
        }

        .file-input {
          cursor: pointer;
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 8px;
        }

        .file-input:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .actions {
          margin-top: 32px;
          text-align: right;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-primary {
          padding: 13px 36px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
          min-height: 48px;
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(30, 136, 229, 0.35);
          transform: translateY(-2px);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .status-ok {
          color: #2e7d32;
          font-weight: bold;
          background: #e8f5e9;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .status-ng {
          color: #c62828;
          font-weight: bold;
          background: #ffebee;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .image-preview {
          margin-top: 8px;
          display: flex;
          justify-content: center;
        }

        .uploaded-image {
          max-width: 100px;
          max-height: 100px;
          border-radius: 4px;
          border: 1px solid #eee;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .uploaded-image:hover {
          transform: scale(1.05);
        }

        .no-photos {
          color: #999;
          font-style: italic;
          font-size: 0.85rem;
          text-align: center;
        }

        /* Mobile Card Styles */
        .inspection-card {
          background: white;
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e0e0e0;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
          transition: background 0.2s;
          min-height: 44px;
        }

        .card-header:hover {
          background: linear-gradient(135deg, #e8eaf6 0%, #d1c4e9 100%);
        }

        .card-no {
          width: 36px;
          height: 36px;
          background: #1e88e5;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .card-info {
          flex: 1;
          min-width: 0;
        }

        .card-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .card-method {
          font-size: 0.8rem;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 12px;
          display: inline-block;
        }

        .expand-icon {
          font-size: 1.2rem;
          color: #64748b;
          transition: transform 0.3s ease;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .card-body {
          padding: 16px;
          background: #fafbfc;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #475569;
          font-size: 0.9rem;
        }

        .radio-group-mobile {
          display: flex;
          gap: 16px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          min-height: 44px;
          padding: 8px 12px;
          border-radius: 8px;
          background: white;
          border: 1.5px solid #e0e0e0;
          transition: all 0.2s;
        }

        .radio-label:hover:not(.disabled) {
          border-color: #1e88e5;
        }

        .radio-label.disabled {
          background: #f5f5f5;
          cursor: not-allowed;
          border-color: #e0e0e0;
        }

        .radio-label input[type="radio"] {
          width: 20px;
          height: 20px;
          accent-color: #1e88e5;
        }

        .radio-label input[type="radio"]:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .radio-text {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .radio-text.ok {
          color: #2e7d32;
        }

        .radio-text.ng {
          color: #c62828;
        }

        .text-input-mobile {
          width: 100%;
          min-height: 100px;
          padding: 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.95rem;
          color: #333;
          transition: all 0.3s ease;
          min-height: 44px;
        }

        .text-input-mobile:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }

        .text-input-mobile:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          color: #999;
        }

        .file-input-mobile {
          width: 100%;
          padding: 12px;
          border: 1.5px dashed #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 0.9rem;
          color: #666;
          min-height: 44px;
        }

        .file-input-mobile:hover:not(:disabled) {
          border-color: #1e88e5;
        }

        .file-input-mobile:disabled {
          cursor: not-allowed;
          opacity: 0.5;
          border-style: solid;
        }

        .image-preview-mobile {
          margin-top: 12px;
          display: flex;
          justify-content: center;
        }

        .uploaded-image-mobile {
          max-width: 120px;
          max-height: 120px;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .uploaded-image-mobile:hover {
          transform: scale(1.05);
        }

        .view-text {
          background: white;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          color: #333;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        /* Loading Overlay */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          color: white;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 6px solid rgba(255, 255, 255, 0.3);
          border-top-color: #4caf50;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ✅ TABLET RESPONSIVE */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          h1 {
            font-size: 1.6rem;
          }

          .form-table {
            font-size: 0.9rem;
          }

          .form-table th,
          .form-table td {
            padding: 12px 8px;
          }
        }

        /* ✅ MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          .page-content {
            padding: 16px 12px;
            margin-left: 0;
          }

          .back-btn {
            width: 100%;
            justify-content: center;
          }

          h1 {
            font-size: 1.4rem;
            margin: 16px 0 20px 0;
          }

          .ref-image {
            padding: 16px;
            margin: 16px 0;
          }

          .ref-image img {
            max-height: 200px;
          }

          /* Hide desktop table, show mobile cards */
          .desktop-view {
            display: none;
          }

          .mobile-view {
            display: block;
          }

          .actions {
            margin-top: 24px;
          }

          .btn-primary {
            width: 100%;
            padding: 14px 24px;
            font-size: 1rem;
          }

          .card-header {
            padding: 14px 12px;
          }

          .card-no {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }

          .card-label {
            font-size: 0.9rem;
          }

          .card-method {
            font-size: 0.75rem;
          }

          .card-body {
            padding: 14px 12px;
          }

          .form-label {
            font-size: 0.85rem;
          }

          .radio-group-mobile {
            flex-direction: column;
            gap: 8px;
          }

          .radio-label {
            min-height: 44px;
          }

          .text-input-mobile {
            min-height: 80px;
            font-size: 0.9rem;
          }

          .uploaded-image-mobile {
            max-width: 100px;
            max-height: 100px;
          }
        }

        /* ✅ SMALL MOBILE */
        @media (max-width: 480px) {
          .page-content {
            padding: 12px 8px;
          }

          .back-btn {
            padding: 10px 14px;
            font-size: 0.9rem;
          }

          h1 {
            font-size: 1.2rem;
            margin: 12px 0 16px 0;
          }

          .ref-image {
            padding: 12px;
            margin: 12px 0;
          }

          .ref-image img {
            max-height: 160px;
          }

          .ref-image p {
            font-size: 0.85rem;
          }

          .card-header {
            padding: 12px 10px;
          }

          .card-no {
            width: 28px;
            height: 28px;
            font-size: 0.85rem;
          }

          .card-label {
            font-size: 0.85rem;
          }

          .card-method {
            font-size: 0.7rem;
            padding: 2px 6px;
          }

          .card-body {
            padding: 12px 10px;
          }

          .form-group {
            margin-bottom: 14px;
          }

          .form-label {
            font-size: 0.8rem;
            margin-bottom: 6px;
          }

          .radio-label {
            padding: 10px;
            font-size: 0.9rem;
          }

          .text-input-mobile {
            min-height: 70px;
            padding: 10px;
            font-size: 0.85rem;
          }

          .file-input-mobile {
            padding: 10px;
            font-size: 0.85rem;
          }

          .uploaded-image-mobile {
            max-width: 80px;
            max-height: 80px;
          }

          .view-text {
            padding: 10px;
            font-size: 0.85rem;
          }

          .btn-primary {
            padding: 12px 20px;
            font-size: 0.95rem;
            min-height: 52px;
          }

          .spinner {
            width: 50px;
            height: 50px;
          }
        }

        /* ── Touch-friendly ─────────────────────────────── */
        @media (hover: none) and (pointer: coarse) {
          .text-input, .text-input-mobile, .file-input, .file-input-mobile {
            font-size: 16px; min-height: 44px;
          }
          .btn-primary { min-height: 44px; }
        }
        
        *, *::before, *::after { box-sizing: border-box; }
        img, svg, video { max-width: 100%; height: auto; display: block; }
        html, body { overflow-x: hidden; width: 100%; min-width: 0; }
      `}</style>
    </div>
  );
}