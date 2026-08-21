"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { QrCode } from "lucide-react";

// ✅ TAMBAHKAN IMPORT HOOK SCAN VERIFICATION
import { useScanVerification } from "@/lib/hooks/useScanVerification";

type PreventiveItem = {
  id: number;
  checkItem: string;
  equipmentSupport: string;
  langkahKerja: string;
  standar: string;
};

const preventiveItems: PreventiveItem[] = [
  {
    id: 1,
    checkItem: "Hook Lift",
    equipmentSupport: "Dye Penetrant Test",
    langkahKerja: "Spray",
    standar: "Tidak ada keretakan",
  },
  {
    id: 2,
    checkItem: "Sling / Wire Rope",
    equipmentSupport: "Grease wire rope",
    langkahKerja: "Spray / oles",
    standar: "Terlumasi",
  },
  {
    id: 3,
    checkItem: "Holder Plate / Cantolan Hook",
    equipmentSupport: "Dye Penetrant Test",
    langkahKerja: "Spray",
    standar: "Tidak ada keretakan",
  },
  {
    id: 4,
    checkItem: "Roda Penggerak naik turun",
    equipmentSupport: "Grease",
    langkahKerja: "Oles",
    standar: "Terlumasi",
  },
  {
    id: 5,
    checkItem: "Limit Switch",
    equipmentSupport: "Kunci Foding",
    langkahKerja: "Mengencangkan Baut",
    standar: "Kepekaan Mendeteksi",
  },
];

type FormData = Record<
  number,
  {
    status: "OK" | "NG";
    keterangan?: string;
    foto_path?: string;
    foto_file?: File | null;
  }
>;

export default function PreventiveLiftBarangPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // ✅ TAMBAHKAN HOOK INI - WAJIB DI TOP LEVEL
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  
  const [redirected, setRedirected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect jika tidak punya akses
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

  const [formData, setFormData] = useState<FormData>({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleStatusChange = (id: number, status: "OK" | "NG") => {
    setFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
        keterangan: status === "OK" ? undefined : prev[id]?.keterangan || "",
      },
    }));
  };

  const handleKeteranganChange = (id: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [id]: { ...prev[id], keterangan: value },
    }));
  };

  // Upload foto
  const handleImageUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      setLoading(true);
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('itemId', 'preventive');
      formDataUpload.append('subItemId', String(id));

      const response = await fetch('/e-checksheet-ga/api/lift-barang/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormData((prev) => ({
          ...prev,
          [id]: { 
            ...prev[id], 
            foto_path: result.data.path,
            foto_file: file
          },
        }));
        alert('✅ Foto berhasil diupload!');
      } else {
        alert('❌ Gagal upload foto: ' + (result.message || 'Error tidak diketahui'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Terjadi kesalahan saat upload foto');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const validateForm = () => {
    for (const item of preventiveItems) {
      const entry = formData[item.id];
      if (entry?.status === "NG") {
        if (!entry.keterangan?.trim()) {
          alert(`❗ Keterangan wajib diisi untuk item "${item.checkItem}" yang berstatus NG.`);
          return false;
        }
      }
    }
    return true;
  };

  const handlePreview = () => {
    if (!validateForm()) return;
    setShowPreview(true);
  };

  // 🔥 SIMPAN KE DATABASE (API)
  const handleSave = async () => {
  try {
    setLoading(true);
    
    // Struktur data yang sesuai dengan API
    const submitData = {
      inspection_date: new Date().toISOString().split('T')[0],
      inspector: user.fullName,
      inspector_nik: user.nik || '',
      items: {
        1: {
          status: formData[1]?.status || 'OK',
          keterangan: formData[1]?.keterangan || '',
          foto_path: formData[1]?.foto_path || null
        },
        2: {
          status: formData[2]?.status || 'OK',
          keterangan: formData[2]?.keterangan || '',
          foto_path: formData[2]?.foto_path || null
        },
        3: {
          status: formData[3]?.status || 'OK',
          keterangan: formData[3]?.keterangan || '',
          foto_path: formData[3]?.foto_path || null
        },
        4: {
          status: formData[4]?.status || 'OK',
          keterangan: formData[4]?.keterangan || '',
          foto_path: formData[4]?.foto_path || null
        },
        5: {
          status: formData[5]?.status || 'OK',
          keterangan: formData[5]?.keterangan || '',
          foto_path: formData[5]?.foto_path || null
        }
      },
      additional_notes: additionalNotes || ''
    };

    console.log('Data yang akan dikirim:', submitData);

    const response = await fetch('/e-checksheet-ga/api/lift-barang/preventive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (response.ok && result.success) {
      alert("✅ Data preventive maintenance berhasil disimpan!");
      router.push("/status-ga/inspeksi-preventif-lift-barang/preventif/riwayat");
    } else {
      const errorMsg = result.message || 'Gagal menyimpan data';
      alert(`❌ ${errorMsg}`);
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert("❌ Terjadi kesalahan saat menyimpan data");
  } finally {
    setLoading(false);
  }
};

  if (showPreview) {
    return (
      <div className="app-page">
        <Sidebar userName={user.fullName} />

        <div className="page-content">
          <div className="header-section">
            <button onClick={() => router.back()} className="btn-back">← Kembali</button>
            <h1>🔍 Preview Data Preventive</h1>
            <button 
              onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang/preventif/riwayat")} 
              className="btn-history"
            >
              📋 Lihat Riwayat
            </button>
          </div>

          <div className="preview-card">
            <h2>Data Pemeriksaan</h2>
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Check Item</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {preventiveItems.map((item) => {
                  const entry = formData[item.id];
                  return (
                    <tr key={item.id}>
                      <td>{item.checkItem}</td>
                      <td>
                        <span className={entry?.status === "NG" ? "status-ng" : "status-ok"}>
                          {entry?.status || "-"}
                        </span>
                      </td>
                      <td>{entry?.keterangan || "-"}</td>
                      <td>
                        {entry?.foto_path ? (
                          <div className="image-preview">
                            <img
                              src={getPhotoUrl(entry.foto_path)}
                              alt="Foto preventive"
                              className="preview-image"
                            />
                          </div>
                        ) : (
                          <span className="no-photos">Tidak ada foto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {additionalNotes && (
              <div className="additional-preview">
                <h3>📝 Saran & Temuan Tambahan:</h3>
                <p>{additionalNotes}</p>
              </div>
            )}
          </div>

          <div className="preview-actions">
            <button onClick={() => setShowPreview(false)} className="btn-secondary" disabled={loading}>
              Kembali ke Form
            </button>
            <button onClick={handleSave} className="btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </div>

        <style jsx>{`
          .page-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
          }
          .header-section {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
            justify-content: space-between;
          }
          .btn-back {
            padding: 10px 16px;
            background: white;
            border: 1.5px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            color: #1565c0;
            transition: all 0.3s ease;
          }
          .btn-back:hover {
            background: #f5f5f5;
            border-color: #1565c0;
            transform: translateX(-2px);
            box-shadow: 0 2px 6px rgba(21, 101, 192, 0.15);
          }
          h1 {
            color: #0277bd;
            margin: 0;
            text-align: center;
            flex: 1;
          }
          .btn-history {
            padding: 10px 16px;
            background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
          }
          .btn-history:hover {
            background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
            box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
            transform: translateY(-2px);
          }
          .preview-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            padding: 24px;
            margin-bottom: 24px;
          }
          .preview-table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
          }
          .preview-table th,
          .preview-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          .preview-table th {
            background: #e1f5fe;
          }
          .status-ok {
            color: green;
            font-weight: bold;
          }
          .status-ng {
            color: red;
            font-weight: bold;
          }
          .additional-preview {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #eee;
          }
          .preview-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
          }
          .btn-primary, .btn-secondary {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }
          .btn-primary {
            background: #0288d1;
            color: white;
          }
          .btn-secondary {
            background: #f5f5f5;
            color: #333;
          }
          /* Styling untuk foto */
          .image-preview {
            text-align: center;
          }
          .preview-image {
            max-width: 80px;
            max-height: 80px;
            border-radius: 4px;
            border: 1px solid #eee;
          }
          .no-photos {
            color: #999;
            font-style: italic;
            font-size: 0.85rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header-section">
          <button onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang")} className="btn-back">← Kembali</button>
          <h1>🔧 B. Preventive Lift Barang</h1>
          <button 
            onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang/preventif/riwayat")} 
            className="btn-history"
          >
            📋 Lihat Riwayat
          </button>
        </div>
        <p className="subtitle">Isi hasil pelaksanaan tindakan preventif berkala</p>

        {/* ✅ SCAN WARNING BANNER - TAMBAHAN BARU */}
        {!isScanned && (
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

        <table className="preventive-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Check Item</th>
              <th>Equipment Support</th>
              <th>Langkah Kerja</th>
              <th>Standar</th>
              <th>Status</th>
              <th>Keterangan (jika NG)</th>
              <th>Foto</th>
            </tr>
          </thead>
          <tbody>
            {preventiveItems.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.checkItem}</td>
                <td>{item.equipmentSupport}</td>
                <td>{item.langkahKerja}</td>
                <td>{item.standar}</td>
                <td>
                  <div className="radio-group">
                    <label className={`radio-label ${!isScanned ? 'disabled' : ''}`}
                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                      <input
                        type="radio"
                        name={`status-${item.id}`}
                        checked={formData[item.id]?.status === "OK"}
                        onChange={() => handleStatusChange(item.id, "OK")}
                        disabled={loading || !isScanned}
                      /> OK
                    </label>
                    <label className={`radio-label ${!isScanned ? 'disabled' : ''}`}
                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                      <input
                        type="radio"
                        name={`status-${item.id}`}
                        checked={formData[item.id]?.status === "NG"}
                        onChange={() => handleStatusChange(item.id, "NG")}
                        disabled={loading || !isScanned}
                      /> NG
                    </label>
                  </div>
                </td>
                <td>
                  {formData[item.id]?.status === "NG" && (
                    <textarea
                      placeholder="Jelaskan kondisi NG..."
                      value={formData[item.id]?.keterangan || ""}
                      onChange={(e) => handleKeteranganChange(item.id, e.target.value)}
                      className="text-area"
                      disabled={loading || !isScanned}
                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                    />
                  )}
                </td>
                <td>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(item.id, e)}
                    disabled={loading || !isScanned}
                    title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                  />
                  {/* Tampilkan preview foto */}
                  {formData[item.id]?.foto_path && (
                    <div className="image-preview">
                      <img
                        src={getPhotoUrl(formData[item.id]!.foto_path!)}
                        alt="Preview"
                        className="uploaded-image"
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="additional-section">
          <h2>📝 Saran dan Temuan Tambahan</h2>
          <textarea
            placeholder="Masukkan saran atau temuan tambahan..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="text-area full"
            disabled={loading || !isScanned}
            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
          />
        </div>

        <div className="actions">
          <button onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang")} className="btn-secondary" disabled={loading}>
            Batal
          </button>
          <button onClick={handlePreview} className="btn-primary" disabled={loading || !isScanned}
            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
            {loading ? 'Memproses...' : 'Preview & Simpan'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        .page-content {
          flex: 1;
          width: calc(100% - 280px);
          margin-left: 280px;
          padding: 24px;
          overflow-x: hidden;
        }
        .header-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          justify-content: space-between;
        }
        .btn-back {
          padding: 10px 16px;
          background: white;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #1565c0;
          transition: all 0.3s ease;
        }
        .btn-back:hover {
          background: #f5f5f5;
          border-color: #1565c0;
          transform: translateX(-2px);
          box-shadow: 0 2px 6px rgba(21, 101, 192, 0.15);
        }
        h1 {
          color: #0277bd;
          margin: 0;
          flex: 1;
          text-align: center;
        }
        .btn-history {
          padding: 10px 16px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
        }
        .btn-history:hover {
          background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
          transform: translateY(-2px);
        }
        .subtitle {
          color: #666;
          margin-bottom: 24px;
          text-align: center;
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

        .preventive-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 32px;
        }
        .preventive-table th,
        .preventive-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .preventive-table th {
          background: #e1f5fe;
        }
        .radio-group {
          display: flex;
          gap: 12px;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }
        .radio-label.disabled {
          color: #999;
          cursor: not-allowed;
        }
        .radio-label input[type="radio"] {
          cursor: pointer;
          accent-color: #0288d1;
        }
        .radio-label input[type="radio"]:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .text-area {
          width: 100%;
          min-height: 60px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
        }
        .text-area:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
          color: #999;
        }
        .text-area.full {
          min-height: 100px;
        }
        .additional-section {
          margin: 32px 0;
        }
        .additional-section h2 {
          margin-bottom: 12px;
          color: #01579b;
        }
        .actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-primary {
          background: #0288d1;
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          background: #0277bd;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }
        .btn-secondary:hover:not(:disabled) {
          background: #e0e0e0;
        }
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        /* Styling untuk foto */
        .image-preview {
          margin-top: 8px;
          display: flex;
          justify-content: center;
        }
        .uploaded-image {
          max-width: 80px;
          max-height: 80px;
          border-radius: 4px;
          border: 1px solid #eee;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .uploaded-image:hover {
          transform: scale(1.05);
        }
        input[type="file"] {
          cursor: pointer;
          font-size: 0.85rem;
          color: #666;
        }
        input[type="file"]:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media (max-width: 1200px) {
          .page-content {
            margin-left: 80px;
            padding: 20px 12px;
          }
        }

        @media (max-width: 768px) {
          .page-content {
            margin-left: 25px;
            margin-right: 15px;
            padding: 16px 12px;
          }

          h1 {
            font-size: 20px !important;
            margin-bottom: 8px !important;
          }

          .subtitle {
            font-size: 13px !important;
          }

          .preventive-table {
            font-size: 11px !important;
            min-width: 700px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .preventive-table th,
          .preventive-table td {
            padding: 8px 6px !important;
            border: 1px solid #ddd !important;
            font-size: 11px;
          }

          .radio-group {
            gap: 8px;
          }

          .text-area {
            font-size: 12px !important;
            min-height: 50px !important;
            padding: 6px !important;
          }

          .text-area.full {
            min-height: 80px;
          }

          input[type="file"] {
            font-size: 11px !important;
          }

          .uploaded-image {
            max-width: 60px;
            max-height: 60px;
          }

          .actions {
            flex-direction: column;
            gap: 8px;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            min-height: 36px;
            font-size: 12px;
            padding: 10px 12px;
          }

          .header-section {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .btn-back,
          .btn-history {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .page-content {
            margin-left: 15px;
            margin-right: 12px;
            padding: 12px 8px;
          }

          h1 {
            font-size: 18px !important;
            margin-bottom: 6px !important;
          }

          .subtitle {
            font-size: 12px !important;
            margin-bottom: 16px !important;
          }

          p {
            font-size: 11px !important;
          }

          .preventive-table {
            font-size: 9px !important;
            min-width: 600px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .preventive-table th,
          .preventive-table td {
            padding: 6px 4px !important;
            border: 1px solid #ddd !important;
            font-size: 9px;
          }

          .radio-group {
            flex-direction: column;
            gap: 6px;
          }

          .text-area {
            font-size: 12px !important;
            min-height: 45px !important;
            padding: 4px !important;
          }

          .text-area.full {
            min-height: 70px;
          }

          input[type="file"] {
            font-size: 10px !important;
          }

          .uploaded-image {
            max-width: 50px;
            max-height: 50px;
          }

          .actions {
            flex-direction: column;
            gap: 6px;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            min-height: 40px;
            font-size: 11px;
            padding: 10px 12px;
          }

          .header-section {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .btn-back,
          .btn-history {
            width: 100%;
            text-align: center;
          }

          .additional-section {
            margin: 16px 0;
          }

          .additional-section h2 {
            font-size: 14px;
          }
        }

        /* ── Touch-friendly ─────────────────────────────── */
        @media (hover: none) and (pointer: coarse) {
          .text-area, input[type="file"] {
            font-size: 16px; min-height: 44px;
          }
          .btn-primary, .btn-secondary, .btn-back, .btn-history { min-height: 44px; }
        }
        
        *, *::before, *::after { box-sizing: border-box; }
        img, svg, video { max-width: 100%; height: auto; display: block; }
        html, body { overflow-x: hidden; width: 100%; min-width: 0; }
      `}</style>
    </div>
  );
}

// Fungsi untuk menangani URL foto dengan benar
function getPhotoUrl(path: string | undefined): string {
  if (!path) return '/placeholder-image.png';
  
  // Jika path sudah berupa URL lengkap, kembalikan saja
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Jika path dimulai dengan /, gunakan path tersebut
  if (path.startsWith('/')) {
    return path;
  }
  
  // Jika tidak, gunakan NEXT_PUBLIC_BASE_URL dengan penanganan trailing slash
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const hasTrailingSlash = baseUrl.endsWith('/');
  const basePath = hasTrailingSlash ? baseUrl : `${baseUrl}/`;
  
  return `${basePath}${path}`;
}