// app/status-ga/e-checksheet-apd/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";

export default function EChecksheetApdPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isOnline, pendingCount } = useConnection()
  const [redirected, setRedirected] = useState(false)

  // Jenis APD dari Excel
  const apdTypes = [
    "SARUNG TANGAN BINTIL",
    "SARUNG TANGAN KATUN",
    "SARUNG TANGAN KULIT",
    "SARUNG TANGAN GREEN NITRIL",
    "SARUNG TANGAN LAS",
    "SARUNG TANGAN RESIISTANCE",
    "SARUNG TANGAN SHOWA BO500",
    "SARUNG TANGAN SHOWA 380",
    "SARUNG TANGAN PU (COMET) (KHUSUS OA)",
    "MASKER KAIN",
    "MASKER FKA",
    "MASKER 3M-3200",
    "CATRIDGE 3M-3303K-10",
    "MASKER 3M-8515 (N950)",
    "KACAMATA GERINDRA",
    "KACAMATA LAS KING",
    "CELEMEK SAKU",
    "CELEMEK TANPA SKAU",
    "CELEMEK KULIT",
    "CELEMEK SISUI",
    "CELEMEK DIP SOLDER",
    "CELEMEK RAYCHEM",
    "SAFETY SHOES KWD 901X",
    "SAFETY SHOES KWD 301X",
    "SAFETY SHOES KWS 200X",
    "SAFETY SHOES KWS 205CX",
    "NPR L-026 & L-026X",
    "TOPENG LAS",
    "VISOR HOLDER",
    "VISOR HOLDER FC48, ANSI Z87+",
    "FACE SHEILD",
    "EAR MUFF",
    "SLEAVE",
    "HELMET",
    "HELM SUSPENSION",
    "TALI HELMET",
    "CATLEPACK",
    "FULL BODY HARNESS",
    "EAR PLUG",
    "TOPI PELINDUNG",
    "BACK SUPPORT",
    "SAFETY HELMET KETINGGIAN",
    "SAFETY VEST"
  ]

  const [selectedType, setSelectedType] = useState("")
  const [items, setItems] = useState<Array<{
    no: number
    nama: string
    nik: string
    tglPengambilan: string
    dept: string
    jobDesc: string
    jumlah: number
    ttd: string
    keterangan: string
  }>>([
    {
      no: 1,
      nama: "",
      nik: "",
      tglPengambilan: new Date().toISOString().split('T')[0],
      dept: "",
      jobDesc: "",
      jumlah: 1,
      ttd: "",
      keterangan: ""
    }
  ])
  const [showPreview, setShowPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  // Validasi akses
  useEffect(() => {
    if (redirected) return;
    if (!user || !isAuthorizedForChecksheet(user)) {
      setRedirected(true)
      router.push("/home")
    }
  }, [user, router, redirected])

  const handleAddRow = () => {
    setItems([...items, {
      no: items.length + 1,
      nama: "",
      nik: "",
      tglPengambilan: new Date().toISOString().split('T')[0],
      dept: "",
      jobDesc: "",
      jumlah: 1,
      ttd: "",
      keterangan: ""
    }])
  }

  const handleRemoveRow = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    const updatedItems = newItems.map((item, idx) => ({ ...item, no: idx + 1 }))
    setItems(updatedItems)
  }

  const handleInputChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const toggleExpandItem = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index)
  }

  const handleShowPreview = () => {
    if (!selectedType) {
      alert("⚠️ Silakan pilih jenis APD terlebih dahulu!")
      return
    }
    for (const item of items) {
      if (!item.nama.trim()) {
        alert("⚠️ Kolom 'Nama' wajib diisi!")
        return
      }
      if (!item.nik.trim()) {
        alert("⚠️ Kolom 'NIK' wajib diisi!")
        return
      }
      if (!item.tglPengambilan) {
        alert("⚠️ Kolom 'Tgl. Pengambilan' wajib diisi!")
        return
      }
      if (!item.dept.trim()) {
        alert("⚠️ Kolom 'Dept' wajib diisi!")
        return
      }
      if (!item.jobDesc.trim()) {
        alert("⚠️ Kolom 'Job Desc' wajib diisi!")
        return
      }
      if (item.jumlah <= 0) {
        alert("⚠️ Kolom 'Jumlah' harus lebih dari 0!")
        return
      }
    }
    const validItems = items.filter(item => item.nama.trim())
    if (validItems.length === 0) {
      alert("⚠️ Minimal 1 baris harus diisi!")
      return
    }
    setShowPreview(true)
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      if (!selectedType.trim()) {
        throw new Error("Jenis APD belum dipilih");
      }
      if (!user?.fullName || !user?.nik) {
        throw new Error("Informasi user tidak lengkap");
      }
      const validItems = items.filter(item => item.nama.trim() && item.nik.trim());
      if (validItems.length === 0) {
        throw new Error("Minimal 1 baris harus diisi dengan Nama dan NIK");
      }
      for (const item of validItems) {
        if (!item.nama.trim()) throw new Error(`Baris ${item.no}: Nama wajib diisi`);
        if (!item.nik.trim()) throw new Error(`Baris ${item.no}: NIK wajib diisi`);
        if (!item.tglPengambilan) throw new Error(`Baris ${item.no}: Tanggal pengambilan wajib diisi`);
        if (!item.dept.trim()) throw new Error(`Baris ${item.no}: Departemen wajib diisi`);
        if (!item.jobDesc.trim()) throw new Error(`Baris ${item.no}: Job Description wajib diisi`);
        if (item.jumlah <= 0) throw new Error(`Baris ${item.no}: Jumlah harus lebih dari 0`);
      }
      const today = new Date().toISOString().split('T')[0];
      const apiPayload = {
        jenisApd: selectedType,
        date: today,
        checker: user.fullName,
        checkerNik: user.nik,
        items: validItems.map(item => ({
          no: item.no,
          nama: item.nama.trim(),
          nik: item.nik.trim(),
          tglPengambilan: item.tglPengambilan,
          dept: item.dept.trim(),
          jobDesc: item.jobDesc.trim(),
          jumlah: item.jumlah,
          keterangan: item.keterangan?.trim() || ""
        }))
      };
      console.log('📤 Sending to API:', apiPayload);
      const response = await smartFetch('/e-checksheet-ga/api/apd/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(apiPayload),
        credentials: 'include',
        queueType: 'apd',
        metadata: { areaCode: 'apd-form' }
      });
      console.log('📥 Response status:', response.status);
      const result = await response.json();
      console.log('📥 Response body:', result);
      if (!response.ok || !result.success) {
        console.error('❌ API Error:', result);
        throw new Error(result.message || 'Gagal menyimpan data');
      }
      alert(`✅ Data berhasil disimpan!
ID: ${result.id}
Jenis APD: ${selectedType}
Total Item: ${validItems.length}`);
      setSelectedType("");
      setItems([{
        no: 1,
        nama: "",
        nik: "",
        tglPengambilan: new Date().toISOString().split('T')[0],
        dept: "",
        jobDesc: "",
        jumlah: 1,
        ttd: "",
        keterangan: ""
      }]);
      setShowPreview(false);
      router.push("/status-ga/e-checksheet-apd/riwayat-apd");
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga';
      alert(`❌ Gagal menyimpan data
${errorMessage}
Silakan cek kembali data Anda dan coba lagi.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false)
  }

  // ✅ FUNGSI CANCEL BARU - KEMBALI KE RIWAYAT
  const handleCancel = () => {
    if (confirm("⚠️ Apakah Anda yakin ingin membatalkan dan kembali ke halaman riwayat?")) {
      router.push("/status-ga/e-checksheet-apd/riwayat-apd");
    }
  }

  if (!user) return null

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        <div className="header">
          <h1>📋 Form Pengambilan APD</h1>
          <div className="user-info">
            <span>Selamat datang, {user.fullName}</span>
          </div>
        </div>
        <div className="form-container">
          {!showPreview ? (
            <>
              {/* Dropdown Jenis APD */}
              <div className="apd-type-selector">
                <label htmlFor="apd-type">Jenis APD:</label>
                <select
                  id="apd-type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="apd-select"
                  required
                >
                  <option value="">-- Pilih Jenis APD --</option>
                  {apdTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {selectedType && (
                  <div className="preview-box">
                    📥 Data akan disimpan ke: <strong>{selectedType}</strong>
                  </div>
                )}
              </div>

              {/* ✅ DESKTOP: Table View */}
              <div className="desktop-view">
                <div className="checklist-table">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th className="col-no">No</th>
                        <th className="col-nama">Nama *</th>
                        <th className="col-nik">NIK *</th>
                        <th className="col-tgl">Tgl. Pengambilan *</th>
                        <th className="col-dept">Dept *</th>
                        <th className="col-job">Job Desc *</th>
                        <th className="col-jumlah">Jumlah *</th>
                        <th className="col-ket">Keterangan</th>
                        <th className="col-aksi">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="col-no">{item.no}</td>
                          <td className="col-nama">
                            <input
                              type="text"
                              value={item.nama}
                              onChange={(e) => handleInputChange(index, "nama", e.target.value)}
                              placeholder="Nama karyawan"
                              className="table-input"
                              required
                            />
                          </td>
                          <td className="col-nik">
                            <input
                              type="text"
                              value={item.nik}
                              onChange={(e) => handleInputChange(index, "nik", e.target.value)}
                              placeholder="NIK"
                              className="table-input"
                              required
                            />
                          </td>
                          <td className="col-tgl">
                            <input
                              type="date"
                              value={item.tglPengambilan}
                              onChange={(e) => handleInputChange(index, "tglPengambilan", e.target.value)}
                              className="table-input"
                              required
                            />
                          </td>
                          <td className="col-dept">
                            <input
                              type="text"
                              value={item.dept}
                              onChange={(e) => handleInputChange(index, "dept", e.target.value)}
                              placeholder="Departemen"
                              className="table-input"
                              required
                            />
                          </td>
                          <td className="col-job">
                            <input
                              type="text"
                              value={item.jobDesc}
                              onChange={(e) => handleInputChange(index, "jobDesc", e.target.value)}
                              placeholder="Jabatan"
                              className="table-input"
                              required
                            />
                          </td>
                          <td className="col-jumlah">
                            <input
                              type="number"
                              min="1"
                              value={item.jumlah}
                              onChange={(e) => handleInputChange(index, "jumlah", Number(e.target.value))}
                              className="table-input"
                              required
                            />
                          </td>
                          <td className="col-ket">
                            <input
                              type="text"
                              value={item.keterangan}
                              onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                              placeholder="Catatan..."
                              className="table-input"
                            />
                          </td>
                          <td className="col-aksi">
                            {items.length > 1 && (
                              <button
                                onClick={() => handleRemoveRow(index)}
                                className="remove-btn"
                                title="Hapus baris"
                              >
                                ✖
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ✅ MOBILE: Card View */}
              <div className="mobile-view">
                {items.map((item, index) => (
                  <div key={index} className="item-card">
                    <div
                      className="card-header"
                      onClick={() => toggleExpandItem(index)}
                    >
                      <div className="card-no">{item.no}</div>
                      <div className="card-info">
                        <div className="card-nama">{item.nama || 'Belum diisi'}</div>
                        <div className="card-nik">NIK: {item.nik || '-'}</div>
                      </div>
                      <div className={`expand-icon ${expandedItem === index ? 'expanded' : ''}`}>
                        {expandedItem === index ? '▲' : '▼'}
                      </div>
                    </div>
                    {expandedItem === index && (
                      <div className="card-body">
                        <div className="form-group">
                          <label className="form-label">Nama *</label>
                          <input
                            type="text"
                            value={item.nama}
                            onChange={(e) => handleInputChange(index, "nama", e.target.value)}
                            placeholder="Nama karyawan"
                            className="form-input"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">NIK *</label>
                          <input
                            type="text"
                            value={item.nik}
                            onChange={(e) => handleInputChange(index, "nik", e.target.value)}
                            placeholder="NIK"
                            className="form-input"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Tgl. Pengambilan *</label>
                          <input
                            type="date"
                            value={item.tglPengambilan}
                            onChange={(e) => handleInputChange(index, "tglPengambilan", e.target.value)}
                            className="form-input"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Dept *</label>
                          <input
                            type="text"
                            value={item.dept}
                            onChange={(e) => handleInputChange(index, "dept", e.target.value)}
                            placeholder="Departemen"
                            className="form-input"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Job Desc *</label>
                          <input
                            type="text"
                            value={item.jobDesc}
                            onChange={(e) => handleInputChange(index, "jobDesc", e.target.value)}
                            placeholder="Jabatan"
                            className="form-input"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Jumlah *</label>
                          <input
                            type="number"
                            min="1"
                            value={item.jumlah}
                            onChange={(e) => handleInputChange(index, "jumlah", Number(e.target.value))}
                            className="form-input"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Keterangan</label>
                          <input
                            type="text"
                            value={item.keterangan}
                            onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                            placeholder="Catatan tambahan..."
                            className="form-input"
                          />
                        </div>
                        {items.length > 1 && (
                          <button
                            onClick={() => handleRemoveRow(index)}
                            className="remove-btn-mobile"
                          >
                            🗑️ Hapus Baris
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ✅ ACTION BUTTONS - FORM MODE */}
              <div className="table-actions">
                <button onClick={handleCancel} className="cancel-exit-btn" type="button">
                  🚫 Cancel / Kembali
                </button>
                <button onClick={handleAddRow} className="add-btn">
                  ➕ Tambah Baris
                </button>
                <button onClick={handleShowPreview} className="submit-btn" disabled={!selectedType || submitting}>
                  {submitting ? "💾 Menyimpan..." : "👁️ Preview & Simpan"}
                </button>
              </div>
            </>
          ) : (
            /* Preview Mode */
            <div className="preview-container">
              <h2 className="preview-title">🔍 Preview Data</h2>
              <div className="preview-info">
                <p><strong>Jenis APD:</strong> {selectedType}</p>
                <p><strong>Total Item:</strong> {items.filter(i => i.nama.trim()).length}</p>
              </div>

              {/* ✅ DESKTOP: Preview Table */}
              <div className="desktop-view">
                <div className="preview-table">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>NIK</th>
                        <th>Tgl. Pengambilan</th>
                        <th>Dept</th>
                        <th>Job Desc</th>
                        <th>Jumlah</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.filter(i => i.nama.trim()).map((item, index) => (
                        <tr key={index}>
                          <td>{item.no}</td>
                          <td>{item.nama}</td>
                          <td>{item.nik}</td>
                          <td>{item.tglPengambilan}</td>
                          <td>{item.dept}</td>
                          <td>{item.jobDesc}</td>
                          <td>{item.jumlah}</td>
                          <td>{item.keterangan || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ✅ MOBILE: Preview Cards */}
              <div className="mobile-view">
                {items.filter(i => i.nama.trim()).map((item, index) => (
                  <div key={index} className="preview-item-card">
                    <div className="preview-card-header">
                      <span className="preview-card-no">#{item.no}</span>
                      <span className="preview-card-jumlah">{item.jumlah} Unit</span>
                    </div>
                    <div className="preview-card-body">
                      <div className="preview-row">
                        <span className="preview-label">Nama:</span>
                        <span className="preview-value">{item.nama}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">NIK:</span>
                        <span className="preview-value">{item.nik}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">Tgl. Pengambilan:</span>
                        <span className="preview-value">{item.tglPengambilan}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">Dept:</span>
                        <span className="preview-value">{item.dept}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">Job Desc:</span>
                        <span className="preview-value">{item.jobDesc}</span>
                      </div>
                      {item.keterangan && (
                        <div className="preview-row">
                          <span className="preview-label">Keterangan:</span>
                          <span className="preview-value">{item.keterangan}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ ACTION BUTTONS - PREVIEW MODE */}
              <div className="preview-actions">
                <button onClick={handleCancel} className="cancel-exit-btn" type="button">
                  🚫 Batal & Kembali ke Riwayat
                </button>
                <button onClick={handleCancelPreview} className="cancel-btn">
                  ← Kembali ke Form
                </button>
                <button onClick={handleSave} className="save-btn" disabled={submitting}>
                  {submitting ? "💾 Menyimpan..." : "💾 Simpan Data"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }
        .page-content {
          flex: 1;
          width: calc(100% - 280px);
          margin-left: 280px;
          padding: 24px;
          max-width: 1400px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .header h1 {
          margin: 0;
          color: #0d47a1;
          font-size: 2rem;
          font-weight: 700;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.95rem;
          color: #666;
        }
        .form-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 24px;
        }
        .apd-type-selector {
          margin-bottom: 24px;
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .apd-type-selector label {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }
        .apd-select {
          padding: 11px 16px;
          border: 1.5px solid #ccc;
          border-radius: 8px;
          font-size: 0.95rem;
          min-width: 300px;
          cursor: pointer;
          min-height: 44px;
          background: white;
        }
        .apd-select:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
        }
        .preview-box {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          margin-left: 16px;
          font-size: 0.9rem;
        }
        /* Desktop View */
        .desktop-view {
          display: block;
        }
        .mobile-view {
          display: none;
        }
        .checklist-table,
        .preview-table {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          border-radius: 8px;
          overflow: hidden;
          min-width: 900px;
        }
        .simple-table th,
        .simple-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .simple-table th {
          background: #f5f9ff;
          font-weight: 600;
          color: #333;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .table-input {
          width: 100%;
          padding: 10px;
          border: 1.5px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
          min-height: 44px;
          background: white;
        }
        .table-input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
        }
        .table-input[type="date"] {
          padding: 9px 10px;
        }
        .remove-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #f44336;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 6px;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .remove-btn:hover {
          background: #ffebee;
        }
        .table-actions,
        .preview-actions {
          display: flex;
          gap: 16px;
          justify-content: space-between;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        /* ✅ TOMBOL CANCEL EXIT - BARU */
        .cancel-exit-btn {
          padding: 12px 20px;
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 48px;
          min-width: 160px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .cancel-exit-btn:hover {
          background: #ffcdd2;
          border-color: #ef9a9a;
        }
        .add-btn {
          padding: 12px 20px;
          background: #1e88e5;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 48px;
          min-width: 160px;
        }
        .add-btn:hover {
          background: #1565c0;
        }
        .submit-btn,
        .save-btn {
          padding: 12px 28px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          min-height: 48px;
          min-width: 180px;
        }
        .submit-btn:hover:not(:disabled),
        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 60, 114, 0.3);
        }
        .submit-btn:disabled,
        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        /* Preview Styles */
        .preview-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .preview-title {
          margin: 0 0 16px;
          color: #0d47a1;
          font-size: 1.5rem;
          text-align: center;
          font-weight: 700;
        }
        .preview-info {
          background: #f5f9ff;
          padding: 16px;
          border-radius: 8px;
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .preview-info p {
          margin: 0;
          font-size: 0.95rem;
        }
        .cancel-btn {
          padding: 12px 28px;
          background: #f5f5f5;
          color: #333;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 48px;
          min-width: 180px;
        }
        .cancel-btn:hover {
          background: #e0e0e0;
        }
        /* Mobile Card Styles */
        .item-card,
        .preview-item-card {
          background: white;
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1.5px solid #e0e0e0;
        }
        .card-header,
        .preview-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
          transition: background 0.2s;
          min-height: 44px;
        }
        .card-header:hover,
        .preview-card-header:hover {
          background: linear-gradient(135deg, #e8eaf6 0%, #d1c4e9 100%);
        }
        .card-no,
        .preview-card-no {
          width: 40px;
          height: 40px;
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
        .preview-card-jumlah {
          margin-left: auto;
          background: #1e88e5;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .card-info {
          flex: 1;
          min-width: 0;
        }
        .card-nama {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .card-nik {
          font-size: 0.85rem;
          color: #64748b;
        }
        .expand-icon {
          font-size: 1.2rem;
          color: #64748b;
          transition: transform 0.3s ease;
        }
        .expand-icon.expanded {
          transform: rotate(180deg);
        }
        .card-body,
        .preview-card-body {
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
          margin-bottom: 6px;
          font-weight: 600;
          color: #475569;
          font-size: 0.9rem;
        }
        .form-input {
          width: 100%;
          padding: 11px 12px;
          border: 1.5px solid #ddd;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: white;
          min-height: 44px;
        }
        .form-input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }
        .remove-btn-mobile {
          width: 100%;
          padding: 12px 16px;
          background: #ffebee;
          color: #c62828;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
          min-height: 48px;
          font-size: 0.95rem;
        }
        .remove-btn-mobile:hover {
          background: #ffcdd2;
        }
        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
          gap: 12px;
        }
        .preview-row:last-child {
          border-bottom: none;
        }
        .preview-label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
          min-width: 120px;
          flex-shrink: 0;
        }
        .preview-value {
          font-size: 0.9rem;
          color: #1e293b;
          word-break: break-word;
          text-align: right;
          flex: 1;
        }

        /* ✅ TABLET RESPONSIVE (768px - 1024px) */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }
          .header h1 {
            font-size: 1.75rem;
          }
          .simple-table {
            min-width: 800px;
          }
          .simple-table th,
          .simple-table td {
            padding: 10px 8px;
          }
        }

        /* ✅ MOBILE RESPONSIVE (≤ 768px) */
        @media (max-width: 768px) {
          .page-content {
            width: 100%;
            margin-left: 0;
            padding: 16px 12px;
          }
          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .header h1 {
            font-size: 1.5rem;
            margin: 0;
          }
          .user-info {
            font-size: 0.9rem;
            width: 100%;
          }
          .form-container {
            padding: 16px 12px;
          }
          .apd-type-selector {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .apd-type-selector label {
            font-size: 0.9rem;
          }
          .apd-select,
          .preview-box {
            min-width: 100%;
            width: 100%;
            margin-left: 0;
          }
          .apd-select {
            font-size: 0.9rem;
            min-height: 48px;
          }
          .preview-box {
            font-size: 0.85rem;
            padding: 10px 14px;
          }
          /* Hide desktop table, show mobile cards */
          .desktop-view {
            display: none;
          }
          .mobile-view {
            display: block;
          }
          .card-header,
          .preview-card-header {
            padding: 14px 12px;
          }
          .card-no,
          .preview-card-no {
            width: 36px;
            height: 36px;
            font-size: 0.9rem;
          }
          .card-nama {
            font-size: 0.9rem;
          }
          .card-nik {
            font-size: 0.8rem;
          }
          .card-body,
          .preview-card-body {
            padding: 14px 12px;
          }
          .form-label {
            font-size: 0.85rem;
          }
          .form-input {
            font-size: 0.9rem;
            min-height: 48px;
            padding: 11px 12px;
          }
          .preview-label {
            min-width: 100px;
            font-size: 0.8rem;
          }
          .preview-value {
            font-size: 0.85rem;
          }
          /* ✅ MOBILE BUTTONS - COLUMN REVERSE */
          .table-actions,
          .preview-actions {
            flex-direction: column-reverse;
            gap: 12px;
            margin-top: 16px;
          }
          .cancel-exit-btn,
          .add-btn,
          .submit-btn,
          .save-btn,
          .cancel-btn {
            width: 100%;
            min-width: 100%;
            min-height: 52px;
          }
        }

        /* ✅ SMALL MOBILE (≤ 480px) */
        @media (max-width: 480px) {
          .page-content {
            padding: 12px 8px;
          }
          .header h1 {
            font-size: 1.3rem;
          }
          .user-info {
            font-size: 0.85rem;
          }
          .form-container {
            padding: 12px 8px;
          }
          .apd-type-selector {
            gap: 8px;
          }
          .apd-type-selector label {
            font-size: 0.85rem;
          }
          .apd-select {
            font-size: 0.85rem;
            min-height: 44px;
            padding: 10px 12px;
          }
          .preview-box {
            font-size: 0.8rem;
            padding: 8px 12px;
          }
          .card-header,
          .preview-card-header {
            padding: 12px 10px;
          }
          .card-no,
          .preview-card-no {
            width: 32px;
            height: 32px;
            font-size: 0.85rem;
          }
          .card-nama {
            font-size: 0.85rem;
          }
          .card-nik {
            font-size: 0.75rem;
          }
          .card-body,
          .preview-card-body {
            padding: 12px 10px;
          }
          .form-group {
            margin-bottom: 14px;
          }
          .form-label {
            font-size: 0.8rem;
            margin-bottom: 5px;
          }
          .form-input {
            font-size: 0.85rem;
            min-height: 44px;
            padding: 10px 11px;
          }
          .preview-row {
            padding: 8px 0;
          }
          .preview-label {
            min-width: 90px;
            font-size: 0.75rem;
          }
          .preview-value {
            font-size: 0.8rem;
          }
          .remove-btn-mobile {
            padding: 11px 14px;
            font-size: 0.9rem;
            min-height: 48px;
          }
          .cancel-exit-btn,
          .add-btn,
          .submit-btn,
          .save-btn,
          .cancel-btn {
            min-height: 52px;
            font-size: 0.9rem;
            padding: 12px 20px;
          }
          .preview-title {
            font-size: 1.3rem;
          }
          .preview-info {
            padding: 12px;
            gap: 12px;
          }
          .preview-info p {
            font-size: 0.85rem;
          }
        }

        /* ✅ EXTRA SMALL MOBILE (≤ 360px) */
        @media (max-width: 360px) {
          .page-content {
            padding: 10px 6px;
          }
          .header h1 {
            font-size: 1.2rem;
          }
          .form-container {
            padding: 10px 6px;
          }
          .apd-select {
            font-size: 0.8rem;
            min-height: 40px;
          }
          .card-header,
          .preview-card-header {
            padding: 10px 8px;
          }
          .card-no,
          .preview-card-no {
            width: 28px;
            height: 28px;
            font-size: 0.8rem;
          }
          .card-nama {
            font-size: 0.8rem;
          }
          .card-nik {
            font-size: 0.7rem;
          }
          .form-label {
            font-size: 0.75rem;
          }
          .form-input {
            font-size: 0.8rem;
            min-height: 40px;
          }
          .preview-label {
            min-width: 80px;
            font-size: 0.7rem;
          }
          .preview-value {
            font-size: 0.75rem;
          }
          .cancel-exit-btn,
          .add-btn,
          .submit-btn,
          .save-btn,
          .cancel-btn {
            min-height: 48px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  )
}