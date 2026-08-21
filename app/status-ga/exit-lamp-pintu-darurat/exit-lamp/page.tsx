// app/status-ga/exit-lamp-pintu-darurat/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { QrCode } from "lucide-react";

// ✅ TAMBAHKAN IMPORT HOOK SCAN VERIFICATION
import { useScanVerification } from "@/lib/hooks/useScanVerification";

export default function ExitLampChecklist() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, pendingCount } = useConnection();

  // ✅ TAMBAHKAN HOOK INI - WAJIB DI TOP LEVEL
  const { isScanned, isLoading: scanLoading } = useScanVerification();

  const today = new Date().toISOString().split("T")[0];
  const date = today;

  const locations = [
    { no: 1, lokasi: "Lobby", id: "OFFICE-01" },
    { no: 2, lokasi: "Depan Meeting Room", id: "OFFICE-02" },
    { no: 3, lokasi: "Pintu Keluar Main Office", id: "OFFICE-03" },
    { no: 4, lokasi: "Pintu Belakang Selatan Main Office", id: "OFFICE-04" },
    { no: 5, lokasi: "Pintu Keluar training room", id: "TRN-01" },
    { no: 6, lokasi: "Ruang kelas training A", id: "TRN-02" },
    { no: 7, lokasi: "Pintu Auditorium", id: "AUDI-01" },
    { no: 8, lokasi: "Pintu Darurat Auditorium", id: "AUDI-02" },
    { no: 9, lokasi: "Pintu 1 Genba A", id: "A-01" },
    { no: 10, lokasi: "Pintu 2 Genba A", id: "A-02" },
    { no: 11, lokasi: "Pintu 3 Genba A", id: "A-03" },
    { no: 12, lokasi: "Pintu 7 Genba A", id: "A-04" },
    { no: 13, lokasi: "Pintu 8 Genba A", id: "A-05" },
    { no: 14, lokasi: "Pintu 9 Genba A", id: "A-06" },
    { no: 15, lokasi: "Pintu utama Genba B", id: "B-01" },
    { no: 16, lokasi: "Pintu Darurat Genba B", id: "B-02" },
    { no: 17, lokasi: "Pintu 1 Genba C (Selatan)", id: "C-01" },
    { no: 18, lokasi: "Pintu 2 Genba C (tengah)", id: "C-02" },
    { no: 19, lokasi: "Pintu 3 Genba C (utara)", id: "C-03" },
    { no: 20, lokasi: "Gel sheet Pintu utara", id: "C-04" },
    { no: 21, lokasi: "Gel sheet Pintu darurat", id: "C-05" },
    { no: 22, lokasi: "OFFICE JIG PROTO", id: "JP-01" },
    { no: 23, lokasi: "PINTU SELATAN JIG PROTO", id: "JP-02" },
    { no: 24, lokasi: "PINTU UTAMA JIG PROTO (SISI UTARA)", id: "JP-03" },
    { no: 25, lokasi: "CNC ROOM", id: "JP-04" },
    { no: 26, lokasi: "KANTIN SISI UTARA", id: "KANTIN-01" },
    { no: 27, lokasi: "KANTIN SISI SELATAN", id: "KANTIN-02" },
    { no: 28, lokasi: "PARKIR MOTOR BAWAH TIMUR", id: "PARKIR-01" },
    { no: 29, lokasi: "PARKIR MOTOR BAWAH BARAT", id: "PARKIR-02" },
    { no: 30, lokasi: "PARKIR MOTOR ATAS BARAT", id: "PARKIR-03" },
    { no: 31, lokasi: "PARKIR MOTOR ATAS TIMUR", id: "PARKIR-04" },
  ];

  const [items, setItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  // Validasi akses
  useEffect(() => {
    if (!user || !isAuthorizedForChecksheet(user)) {
      router.push("/home");
    }
  }, [user, router]);

  useEffect(() => {
    const initialItems = locations.map((loc) => ({
      no: loc.no,
      lokasi: loc.lokasi,
      id: loc.id,
      kondisiLampu: "",
      indikatorLampu: "",
      kebersihan: "",
      keterangan: "",
      tindakanPerbaikan: "",
      pic: user?.fullName || "",
      foto: "",
    }));
    setItems(initialItems);
  }, [user]);

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange(index, "foto", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOkAll = () => {
    if (!confirm("Apakah Anda yakin ingin mengisi semua item dengan status OK?")) {
      return;
    }

    const updatedItems = items.map(item => ({
      ...item,
      kondisiLampu: "OK",
      indikatorLampu: "OK",
      kebersihan: "OK",
      keterangan: "",
      tindakanPerbaikan: ""
    }));

    setItems(updatedItems);
    alert("✅ Semua item telah diisi dengan status OK!");
  };

  const handleShowPreview = () => {
    for (const item of items) {
      if (!item.kondisiLampu || !item.indikatorLampu || !item.kebersihan) {
        alert("⚠️ Semua kolom status harus diisi!");
        return;
      }
    }

    const ngExists = items.some(
      (item) =>
        item.kondisiLampu === "NG" ||
        item.indikatorLampu === "NG" ||
        item.kebersihan === "NG"
    );

    if (ngExists) {
      const missingKeterangan = items.some(
        (item) =>
          (item.kondisiLampu === "NG" ||
            item.indikatorLampu === "NG" ||
            item.kebersihan === "NG") &&
          (!item.keterangan || item.keterangan.trim() === "")
      );
      if (missingKeterangan) {
        alert("⚠️ Harap isi kolom 'Keterangan' untuk semua item yang berstatus NG!");
        return;
      }
    }

    setHasNg(ngExists);
    setShowPreview(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      const hasEmpty = items.some(item => {
        return !item.kondisiLampu || !item.indikatorLampu || !item.kebersihan;
      });
      
      if (hasEmpty) {
        alert('❌ Semua kolom wajib diisi untuk setiap item!');
        setIsSubmitting(false);
        return;
      }

      const response = await smartFetch('/e-checksheet-ga/api/exit-lamp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          checker: user?.fullName || '',
          nik: user?.nik || '',
          department: user?.department || '',
          items
        }),
        queueType: 'exit_lamp',
        metadata: { areaCode: 'exit-lamp' }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan data');
      }

      alert('✅ Data berhasil disimpan!');
      
      if (result.hasNg) {
        handleReportNg();
      } else {
        router.push('/status-ga/exit-lamp-pintu-darurat');
      }

    } catch (error) {
      console.error('Submit error:', error);
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportNg = () => {
    const ngItems = items
      .filter(
        (item) =>
          item.kondisiLampu === "NG" ||
          item.indikatorLampu === "NG" ||
          item.kebersihan === "NG"
      )
      .map((item) => ({
        name: `${item.lokasi} (${item.id})`,
        notes: item.keterangan || "Tidak ada keterangan",
        foto: item.foto || undefined,
      }));

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: "Exit Lamp & Emergency Lamp",
      shift: "A",
      ngNotes: "Temuan NG dari checklist Exit Lamp",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems,
    };

    localStorage.setItem("temp_ng_report", JSON.stringify(pelaporanData));
    router.push("/pelaporan");
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
  };

  const toggleExpandItem = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header">
          <div className="header-top">
            <button onClick={() => router.back()} className="btn-back">
              ← Kembali
            </button>
            <h1 className="page-title">💡 Exit Lamp & Emergency Lamp</h1>
          </div>
          <p className="subtitle">
            📅{" "}
            <span className="date-text">
              {new Date(date).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>

        {/* ✅ SCAN WARNING BANNER - TAMBAHAN BARU */}
        {!isScanned && (
          <div className="banner banner-warning scan-warning">
            <span>🔒 Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.</span>
            <button 
              onClick={() => router.push("/scan")} 
              className="banner-btn"
              disabled={isSubmitting}
            >
              <QrCode size={14} /> Scan Sekarang
            </button>
          </div>
        )}

        {!showPreview ? (
          <div className="card-container">
            {/* Tombol OK All */}
            <div className="quick-actions">
              <button 
                onClick={handleOkAll} 
                className="btn-ok-all"
                disabled={!isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              >
                ✅ OK All (Isi Semua dengan OK)
              </button>
            </div>

            {/* ✅ DESKTOP: Table View */}
            <div className="desktop-view">
              <table className="checklist-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Lokasi</th>
                    <th>ID</th>
                    <th>Kondisi Lampu</th>
                    <th>Indikator Lampu</th>
                    <th>Kebersihan</th>
                    <th>Keterangan N-OK</th>
                    <th>Tindakan Perbaikan</th>
                    <th>PIC</th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="info-cell">{item.no}</td>
                      <td className="info-cell">{item.lokasi}</td>
                      <td className="info-cell">{item.id}</td>
                      <td>
                        <select
                          value={item.kondisiLampu}
                          onChange={(e) => handleInputChange(index, "kondisiLampu", e.target.value)}
                          className="status-select"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        >
                          <option value="">Pilih</option>
                          <option value="OK">OK</option>
                          <option value="NG">NG</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={item.indikatorLampu}
                          onChange={(e) => handleInputChange(index, "indikatorLampu", e.target.value)}
                          className="status-select"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        >
                          <option value="">Pilih</option>
                          <option value="OK">OK</option>
                          <option value="NG">NG</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={item.kebersihan}
                          onChange={(e) => handleInputChange(index, "kebersihan", e.target.value)}
                          className="status-select"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        >
                          <option value="">Pilih</option>
                          <option value="OK">OK</option>
                          <option value="NG">NG</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.keterangan}
                          onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                          placeholder="Wajib diisi jika NG"
                          className="notes-input"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.tindakanPerbaikan}
                          onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                          placeholder="Tindakan perbaikan..."
                          className="notes-input"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </td>
                      <td>
                        <div className="info-cell">{item.pic}</div>
                      </td>
                      <td>
                        <div className="image-upload">
                          {item.foto ? (
                            <div className="image-preview">
                              <img src={item.foto} alt="Preview" className="uploaded-image" />
                              <button
                                type="button"
                                onClick={() => handleInputChange(index, "foto", "")}
                                className="remove-btn"
                                disabled={!isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className={`file-label ${!isScanned ? 'disabled' : ''}`}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                              📷 Unggah
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="file-input"
                                disabled={!isScanned}
                              />
                            </label>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ MOBILE: Card View */}
            <div className="mobile-view">
              {items.map((item, index) => (
                <div key={index} className="checklist-card">
                  <div className="card-header" onClick={() => toggleExpandItem(index)}>
                    <div className="card-no">{item.no}</div>
                    <div className="card-info">
                      <div className="card-lokasi">{item.lokasi}</div>
                      <div className="card-id">ID: {item.id}</div>
                    </div>
                    <div className={`expand-icon ${expandedItem === index ? 'expanded' : ''}`}>
                      ▼
                    </div>
                  </div>

                  {expandedItem === index && (
                    <div className="card-body">
                      <div className="form-group">
                        <label>Kondisi Lampu</label>
                        <select
                          value={item.kondisiLampu}
                          onChange={(e) => handleInputChange(index, "kondisiLampu", e.target.value)}
                          className="status-select"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        >
                          <option value="">Pilih</option>
                          <option value="OK">OK</option>
                          <option value="NG">NG</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Indikator Lampu</label>
                        <select
                          value={item.indikatorLampu}
                          onChange={(e) => handleInputChange(index, "indikatorLampu", e.target.value)}
                          className="status-select"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        >
                          <option value="">Pilih</option>
                          <option value="OK">OK</option>
                          <option value="NG">NG</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Kebersihan</label>
                        <select
                          value={item.kebersihan}
                          onChange={(e) => handleInputChange(index, "kebersihan", e.target.value)}
                          className="status-select"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        >
                          <option value="">Pilih</option>
                          <option value="OK">OK</option>
                          <option value="NG">NG</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Keterangan N-OK</label>
                        <input
                          type="text"
                          value={item.keterangan}
                          onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                          placeholder="Wajib diisi jika NG"
                          className="notes-input"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </div>

                      <div className="form-group">
                        <label>Tindakan Perbaikan</label>
                        <input
                          type="text"
                          value={item.tindakanPerbaikan}
                          onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                          placeholder="Tindakan perbaikan..."
                          className="notes-input"
                          disabled={!isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </div>

                      <div className="form-group">
                        <label>PIC</label>
                        <div className="info-cell">{item.pic}</div>
                      </div>

                      <div className="form-group">
                        <label>Foto</label>
                        <div className="image-upload">
                          {item.foto ? (
                            <div className="image-preview">
                              <img src={item.foto} alt="Preview" className="uploaded-image" />
                              <button
                                type="button"
                                onClick={() => handleInputChange(index, "foto", "")}
                                className="remove-btn"
                                disabled={!isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className={`file-label file-label-large ${!isScanned ? 'disabled' : ''}`}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                              📷 Unggah Foto
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="file-input"
                                disabled={!isScanned}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button onClick={() => router.back()} className="btn-cancel">
                Batal
              </button>
              <button 
                onClick={handleShowPreview} 
                className="btn-submit"
                disabled={!isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              >
                👁️ Preview & Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="card-container preview-mode">
            <h2 className="preview-title">🔍 Preview Data</h2>

            {/* ✅ DESKTOP: Preview Table */}
            <div className="desktop-preview">
              <div className="table-wrapper-responsive">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Lokasi</th>
                      <th>ID</th>
                      <th>Kondisi Lampu</th>
                      <th>Indikator</th>
                      <th>Kebersihan</th>
                      <th>Keterangan</th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.no}</td>
                        <td>{item.lokasi}</td>
                        <td>{item.id}</td>
                        <td className={item.kondisiLampu === "NG" ? "status-ng" : ""}>
                          {item.kondisiLampu}
                        </td>
                        <td className={item.indikatorLampu === "NG" ? "status-ng" : ""}>
                          {item.indikatorLampu}
                        </td>
                        <td className={item.kebersihan === "NG" ? "status-ng" : ""}>
                          {item.kebersihan}
                        </td>
                        <td>{item.keterangan || "-"}</td>
                        <td>
                          {item.foto ? (
                            <img src={item.foto} alt="Foto" className="preview-image" />
                          ) : (
                            "–"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ✅ MOBILE: Preview Cards */}
            <div className="mobile-preview">
              {items.map((item, index) => {
                const hasNgItem =
                  item.kondisiLampu === "NG" ||
                  item.indikatorLampu === "NG" ||
                  item.kebersihan === "NG";

                return (
                  <div key={index} className={`preview-card ${hasNgItem ? 'preview-card-ng' : ''}`}>
                    <div className="preview-card-header">
                      <span className="preview-card-no">#{item.no}</span>
                      <span className={`preview-card-status ${hasNgItem ? 'status-ng' : 'status-ok'}`}>
                        {hasNgItem ? 'NG' : 'OK'}
                      </span>
                    </div>
                    <div className="preview-card-body">
                      <div className="preview-row">
                        <span className="preview-label">Lokasi:</span>
                        <span className="preview-value">{item.lokasi}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">ID:</span>
                        <span className="preview-value">{item.id}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">Kondisi Lampu:</span>
                        <span className={`preview-value ${item.kondisiLampu === 'NG' ? 'ng' : 'ok'}`}>
                          {item.kondisiLampu}
                        </span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">Indikator:</span>
                        <span className={`preview-value ${item.indikatorLampu === 'NG' ? 'ng' : 'ok'}`}>
                          {item.indikatorLampu}
                        </span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">Kebersihan:</span>
                        <span className={`preview-value ${item.kebersihan === 'NG' ? 'ng' : 'ok'}`}>
                          {item.kebersihan}
                        </span>
                      </div>
                      {item.keterangan && (
                        <div className="preview-row">
                          <span className="preview-label">Keterangan:</span>
                          <span className="preview-value">{item.keterangan}</span>
                        </div>
                      )}
                      {item.foto && (
                        <div className="preview-row">
                          <span className="preview-label">Foto:</span>
                          <img
                            src={item.foto}
                            alt="Foto"
                            className="preview-card-image"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="preview-actions">
              <button onClick={handleCancelPreview} className="cancel-btn" disabled={isSubmitting}>
                ← Kembali ke Form
              </button>
              {hasNg ? (
                <div className="ng-actions">
                  <button onClick={handleReportNg} className="report-btn" disabled={isSubmitting}>
                    📢 Laporkan ke Pelaporan NG
                  </button>
                  <button onClick={handleSave} className="save-btn" disabled={isSubmitting}>
                    {isSubmitting ? '⏳ Menyimpan...' : '💾 Simpan Tanpa Lapor'}
                  </button>
                </div>
              ) : (
                <button onClick={handleSave} className="save-btn" disabled={isSubmitting}>
                  {isSubmitting ? '⏳ Menyimpan...' : '💾 Simpan Data'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
            Cantarell, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
      `}</style>

      <style jsx>{`
        .app-page {
          width: 100%;
          min-height: 100vh;
          display: flex;
        }

        .page-content {
          flex: 1;
          width: calc(100% - 280px);
          margin-left: 280px;
          padding: 24px;
          overflow-x: hidden;
        }

        .header-top {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .page-title {
          margin: 0;
          color: white;
          font-size: 1.8rem;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .btn-back {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          min-height: 44px;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.95);
          margin-top: 8px;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-text {
          font-weight: 700;
          font-size: 1.2rem;
          color: #ffeb3b;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          background: rgba(0, 0, 0, 0.2);
          padding: 4px 12px;
          border-radius: 8px;
          letter-spacing: 0.3px;
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
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
        }
        .banner-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(245,158,11,0.4); }
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

        .card-container {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 16px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          padding: 24px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          width: 100%;
          color: white;
        }

        .preview-mode {
          background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
        }

        /* Quick Actions Section */
        .quick-actions {
          margin-bottom: 20px;
          display: flex;
          justify-content: flex-end;
        }

        .btn-ok-all {
          padding: 12px 24px;
          background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 48px;
        }

        .btn-ok-all:hover {
          background: linear-gradient(135deg, #43a047 0%, #1b5e20 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
        }

        .btn-ok-all:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-ok-all:active:not(:disabled) {
          transform: translateY(0);
        }

        /* Desktop View */
        .desktop-view,
        .desktop-preview {
          display: block;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-view,
        .mobile-preview {
          display: none;
        }

        .table-wrapper-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .checklist-table,
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          color: #333;
          min-width: 1200px;
        }

        .checklist-table th,
        .checklist-table td,
        .simple-table th,
        .simple-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .checklist-table th,
        .simple-table th {
          background: rgba(0, 0, 0, 0.15);
          font-weight: 600;
          position: sticky;
          top: 0;
          color: white;
          z-index: 10;
        }

        .status-select,
        .notes-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 6px;
          font-size: 0.9rem;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          min-height: 44px;
        }

        .status-select:focus,
        .notes-input:focus {
          outline: none;
          border-color: #4fc3f7;
          box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.3);
        }

        .status-select:disabled,
        .notes-input:disabled {
          background: rgba(255,255,255,0.5);
          cursor: not-allowed;
        }

        .info-cell {
          background: rgba(255, 255, 255, 0.4);
          color: white;
          font-weight: 500;
        }

        /* File Label Disabled State */
        .file-label.disabled {
          background: rgba(255,255,255,0.5);
          cursor: not-allowed;
          color: #666;
        }

        /* Mobile Card Styles */
        .checklist-card,
        .preview-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .preview-card-ng {
          border-color: rgba(244, 67, 54, 0.5);
          background: rgba(244, 67, 54, 0.1);
        }

        .card-header,
        .preview-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.1);
          transition: background 0.2s;
          min-height: 44px;
        }

        .card-header:hover,
        .preview-card-header:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .card-no,
        .preview-card-no {
          width: 40px;
          height: 40px;
          background: #1976d2;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .preview-card-status {
          margin-left: auto;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .preview-card-status.ok {
          background: rgba(76, 175, 80, 0.3);
          color: #c8e6c9;
        }

        .preview-card-status.ng {
          background: rgba(244, 67, 54, 0.3);
          color: #ffcdd2;
        }

        .card-info {
          flex: 1;
          min-width: 0;
        }

        .card-lokasi {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          word-break: break-word;
          margin-bottom: 4px;
        }

        .card-id {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .expand-icon {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          transition: transform 0.3s ease;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .card-body,
        .preview-card-body {
          padding: 16px;
          background: rgba(0, 0, 0, 0.1);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          gap: 12px;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          min-width: 100px;
          flex-shrink: 0;
        }

        .preview-value {
          font-size: 0.9rem;
          color: white;
          word-break: break-word;
          text-align: right;
          flex: 1;
        }

        .preview-value.ok {
          color: #c8e6c9;
          font-weight: 600;
        }

        .preview-value.ng {
          color: #ffcdd2;
          font-weight: 600;
        }

        .preview-card-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid white;
          cursor: pointer;
        }

        /* Upload & Preview Image */
        .image-upload {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 44px;
        }

        .file-label {
          display: inline-block;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .file-label-large {
          width: 100%;
          padding: 12px 16px;
        }

        .file-label:hover:not(.disabled) {
          background: rgba(255, 255, 255, 1);
        }

        .file-input {
          display: none;
        }

        .image-preview {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .uploaded-image,
        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid white;
        }

        .preview-image {
          max-width: 80px;
          max-height: 80px;
        }

        .remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #f44336;
          color: white;
          border: 2px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          min-height: 24px;
          min-width: 24px;
        }

        .remove-btn:hover {
          background: #d32f2f;
          transform: scale(1.1);
        }

        .remove-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .form-actions,
        .preview-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .btn-cancel,
        .btn-submit,
        .cancel-btn,
        .save-btn,
        .report-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          min-height: 48px;
          min-width: 120px;
        }

        .btn-cancel,
        .cancel-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .btn-cancel:hover,
        .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-cancel:disabled,
        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-submit {
          background: #4caf50;
          color: white;
        }

        .btn-submit:hover {
          background: #43a047;
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-btn {
          background: #2e7d32;
          color: white;
        }

        .save-btn:hover {
          background: #1b5e20;
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .report-btn {
          background: #d32f2f;
          color: white;
        }

        .report-btn:hover {
          background: #b71c1c;
        }

        .report-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .preview-title {
          margin: 0 0 24px;
          color: white;
          font-size: 1.5rem;
          text-align: center;
          font-weight: 700;
        }

        .status-ng {
          background: rgba(244, 67, 54, 0.3);
          color: #ffcdd2;
          font-weight: bold;
          border-radius: 4px;
          padding: 4px 8px;
        }

        .ng-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ✅ TABLET RESPONSIVE */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          .page-title {
            font-size: 1.6rem;
          }

          .checklist-table,
          .simple-table {
            min-width: 1000px;
            font-size: 0.85rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 10px 8px;
          }
        }

        /* ✅ MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          .page-content {
            width: 100%;
            margin-left: 0;
            padding: 16px 12px;
          }

          .header-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .btn-back {
            width: 100%;
            justify-content: center;
          }

          .page-title {
            font-size: 1.4rem;
            width: 100%;
            text-align: center;
          }

          .subtitle {
            font-size: 0.9rem;
            width: 100%;
          }

          .date-text {
            font-size: 1rem;
            width: 100%;
            text-align: center;
          }

          .card-container {
            padding: 16px 12px;
          }

          /* Hide desktop table, show mobile cards */
          .desktop-view,
          .desktop-preview {
            display: none;
          }

          .mobile-view,
          .mobile-preview {
            display: block;
          }

          .quick-actions {
            justify-content: center;
          }

          .btn-ok-all {
            width: 100%;
            justify-content: center;
          }

          .form-actions,
          .preview-actions,
          .ng-actions {
            flex-direction: column;
            gap: 12px;
          }

          .btn-cancel,
          .btn-submit,
          .cancel-btn,
          .save-btn,
          .report-btn {
            width: 100%;
          }

          .checklist-table,
          .simple-table {
            min-width: 800px;
            font-size: 0.8rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 8px 6px;
          }

          .status-select,
          .notes-input {
            font-size: 0.9rem;
            min-height: 44px;
          }

          .image-preview {
            width: 50px;
            height: 50px;
          }

          .preview-image {
            max-width: 70px;
            max-height: 70px;
          }

          .card-no,
          .preview-card-no {
            width: 36px;
            height: 36px;
            font-size: 1rem;
          }

          .card-lokasi {
            font-size: 0.95rem;
          }

          .preview-label {
            min-width: 80px;
            font-size: 0.8rem;
          }

          .preview-value {
            font-size: 0.85rem;
          }

          .preview-card-image {
            width: 50px;
            height: 50px;
          }
        }

        /* ✅ SMALL MOBILE */
        @media (max-width: 480px) {
          .page-content {
            padding: 12px 8px;
          }

          .page-title {
            font-size: 1.2rem;
          }

          .subtitle {
            font-size: 0.85rem;
          }

          .date-text {
            font-size: 0.9rem;
            padding: 3px 8px;
          }

          .card-container {
            padding: 12px 8px;
          }

          .card-header,
          .preview-card-header {
            padding: 12px;
          }

          .card-no,
          .preview-card-no {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }

          .card-body,
          .preview-card-body {
            padding: 12px;
          }

          .form-group label {
            font-size: 0.85rem;
          }

          .status-select,
          .notes-input {
            font-size: 0.85rem;
            min-height: 44px;
          }

          .file-label {
            padding: 10px 14px;
            font-size: 0.85rem;
            min-height: 44px;
          }

          .file-label-large {
            padding: 12px 14px;
          }

          .image-preview {
            width: 45px;
            height: 45px;
          }

          .preview-image {
            max-width: 60px;
            max-height: 60px;
          }

          .btn-cancel,
          .btn-submit,
          .cancel-btn,
          .save-btn,
          .report-btn {
            min-height: 52px;
            font-size: 0.95rem;
            padding: 14px 20px;
          }

          .checklist-table,
          .simple-table {
            min-width: 700px;
            font-size: 0.75rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 6px 4px;
          }

          .preview-title {
            font-size: 1.3rem;
          }

          .preview-label {
            min-width: 70px;
            font-size: 0.75rem;
          }

          .preview-value {
            font-size: 0.8rem;
          }

          .preview-card-image {
            width: 45px;
            height: 45px;
          }

          .btn-ok-all {
            min-height: 52px;
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  );
}