// app/status-ga/riwayat-apd/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

interface ApdItem {
  no: number
  nama: string
  nik: string
  tglPengambilan: string
  dept: string
  jobDesc: string
  jumlah: number
  keterangan: string
}

interface ApdRecord {
  id: string
  jenisApd: string
  date: string
  checker: string
  checkerNik?: string
  items: ApdItem[]
  submittedAt: string
}

export default function RiwayatApdPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Jenis APD dari Excel
  const apdTypes = [
    "SARUNG TANGAN BINTIL",
    "SARUNG TANGAN KATUN",
    "SARUNG TANGAN KULIT",
    "SARUNG TANGAN GREEN NITRIL",
    "SARUNG TANGAN LAS",
    "SARUNG TANGAN RESISTANCE",
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
    "CELEMEK TANPA SAKU",
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
    "FACE SHIELD",
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

  const [records, setRecords] = useState<ApdRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<ApdRecord[]>([])
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState<{ recordId: string; itemIndex: number } | null>(null)
  const [editItem, setEditItem] = useState<ApdItem | null>(null)
  
  // Filter tanggal
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  
  // ✅ Search untuk APD types
  const [searchQuery, setSearchQuery] = useState("")

  // Validasi akses
  useEffect(() => {
    if (!user || !isAuthorizedForChecksheet(user)) {
      router.push("/home")
    }
  }, [user, router])

  // 🔥 FUNGSI LOAD DATA DARI API
  const loadData = async () => {
    try {
      setLoading(true)
      
      const queryParams = new URLSearchParams()
      if (filterDateFrom) queryParams.append('date_from', filterDateFrom)
      if (filterDateTo) queryParams.append('date_to', filterDateTo)
      queryParams.append('limit', '100')
      queryParams.append('offset', '0')

      const response = await fetch(`/e-checksheet-ga/api/apd/history?${queryParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRecords(data.data || [])
          setFilteredRecords(data.data || [])
        } else {
          alert('Gagal memuat  ' + data.message)
        }
      } else {
        alert('Gagal mengambil data dari server')
      }
    } catch (error) {
      console.error('Error loading APD history:', error)
      alert('Gagal memuat riwayat: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filterDateFrom, filterDateTo])

  const getRecordsByType = (type: string) => {
    return filteredRecords.filter(record => record.jenisApd === type)
  }

  // ✅ Hitung jumlah record per APD type
  const getApdCounts = () => {
    const counts: Record<string, number> = {}
    apdTypes.forEach(type => {
      counts[type] = getRecordsByType(type).length
    })
    return counts
  }

  // ✅ Filter APD types berdasarkan search
  const filteredApdTypes = apdTypes.filter(type =>
    type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (recordId: string, itemIndex: number, item: ApdItem) => {
    setEditMode({ recordId, itemIndex })
    setEditItem({ ...item })
  }

  const handleSaveEdit = async () => {
    if (!editMode || !editItem) return
    try {
      const record = records.find(r => r.id === editMode.recordId)
      if (!record) {
        alert('Data tidak ditemukan')
        return
      }

      const updatedItems = record.items.map((item, idx) =>
        idx === editMode.itemIndex ? editItem : item
      )

      const response = await fetch('/e-checksheet-ga/api/apd/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: editMode.recordId,
          items: updatedItems
        })
      })
      
      if (response.ok) {
        await loadData()
        setEditMode(null)
        setEditItem(null)
        alert('Data berhasil diupdate!')
      } else {
        const error = await response.json()
        alert('Gagal update  ' + error.message)
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Terjadi kesalahan saat update data')
    }
  }

  const handleCancelEdit = () => {
    setEditMode(null)
    setEditItem(null)
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return
    
    try {
      const response = await fetch(`/e-checksheet-ga/api/apd/delete?id=${recordId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadData()
        alert('Data berhasil dihapus!')
      } else {
        const error = await response.json()
        alert('Gagal menghapus  ' + error.message)
      }
    } catch (error) {
      console.error('Error deleting record:', error)
      alert('Terjadi kesalahan saat menghapus data')
    }
  }

  if (!user) return null

  const apdCounts = getApdCounts()

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">
        {/* Header dengan tombol kembali */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga")}
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>

          <div className="header-title">
            <h1>📋 Riwayat Pengambilan APD</h1>
          </div>
          
<Link href="/status-ga/e-checksheet-apd/riwayat-apd/download" className="btn-download">
  📊 Download Laporan
</Link>
        </div>

     

        {/* Filter Tanggal */}
        <div className="date-filter">
          <div className="filter-group">
            <label>Dari Tanggal:</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="filter-group">
            <label>Sampai Tanggal:</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="date-input"
            />
          </div>
          <button
            onClick={() => {
              setFilterDateFrom("")
              setFilterDateTo("")
            }}
            className="clear-filter"
          >
            Reset Filter
          </button>
        </div>

        {/* ✅ APD TYPE SELECTOR - Grid Buttons dengan Search */}
        <div className="apd-selector-section">
          <div className="selector-header">
            <h3 className="selector-title">📦 Pilih Jenis APD</h3>
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Cari APD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="clear-search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div className="apd-buttons-grid">
            {filteredApdTypes.map(type => {
              const count = apdCounts[type] || 0
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`apd-type-btn ${selectedType === type ? 'active' : ''} ${count === 0 ? 'no-data' : ''}`}
                >
                  <span className="btn-label">{type}</span>
                  {count > 0 && <span className="btn-count">{count}</span>}
                </button>
              )
            })}
          </div>
          
          {filteredApdTypes.length === 0 && (
            <div className="no-results">
              Tidak ditemukan APD dengan kata kunci "{searchQuery}"
            </div>
          )}
        </div>

        {/* Konten Utama: Tabel Data */}
        <div className="main-content">
          {selectedType ? (
            <>
              <div className="content-header">
                <h2>{selectedType}</h2>
                <Link href="/status-ga/e-checksheet-apd" className="btn-add">
                  ➕ Tambah Data
                </Link>
              </div>

              {loading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Memuat data...</p>
                </div>
              ) : getRecordsByType(selectedType).length === 0 ? (
                <div className="empty-state">
                  Belum ada data untuk {selectedType}.
                </div>
              ) : (
                <div className="data-tables">
                  {getRecordsByType(selectedType).map((record) => (
                    <div key={record.id} className="data-section">
                      <div className="section-header">
                        <div className="section-info">
                          <span className="info-item">📅 {new Date(record.submittedAt).toLocaleDateString("id-ID")}</span>
                          <span className="info-item">👤 {record.checker}</span>
                        </div>
                        <div className="section-actions">
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="delete-btn"
                            title="Hapus data"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* ✅ DESKTOP: Table View */}
                      <div className="desktop-view">
                        <table className="apd-table">
                          <thead>
                            <tr>
                              <th className="col-no">No</th>
                              <th className="col-nama">Nama</th>
                              <th className="col-nik">NIK</th>
                              <th className="col-tgl">Tgl.</th>
                              <th className="col-dept">Dept</th>
                              <th className="col-job">Job Desc</th>
                              <th className="col-jumlah">Jml</th>
                              <th className="col-ket">Ket</th>
                              <th className="col-aksi">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.items.map((item, idx) => (
                              <tr key={`${record.id}-${idx}`}>
                                <td className="col-no">{item.no}</td>
                                <td className="col-nama">
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.nama || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, nama: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.nama
                                  )}
                                </td>
                                <td className="col-nik">
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.nik || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, nik: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.nik
                                  )}
                                </td>
                                <td className="col-tgl">
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="date"
                                      value={editItem?.tglPengambilan || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, tglPengambilan: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.tglPengambilan
                                  )}
                                </td>
                                <td className="col-dept">
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.dept || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, dept: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.dept
                                  )}
                                </td>
                                <td className="col-job">
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.jobDesc || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, jobDesc: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.jobDesc
                                  )}
                                </td>
                                <td className="col-jumlah">
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="number"
                                      min="1"
                                      value={editItem?.jumlah || 1}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, jumlah: Number(e.target.value) } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.jumlah
                                  )}
                                </td>
                                <td className="col-ket">
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <input
                                      type="text"
                                      value={editItem?.keterangan || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, keterangan: e.target.value } : null)}
                                      className="edit-input"
                                    />
                                  ) : (
                                    item.keterangan || "-"
                                  )}
                                </td>
                                <td className="col-aksi">
                                  {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                    <div className="edit-actions">
                                      <button onClick={handleSaveEdit} className="save-btn" title="Simpan">💾</button>
                                      <button onClick={handleCancelEdit} className="cancel-btn" title="Batal">❌</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleEdit(record.id, idx, item)}
                                      className="edit-btn"
                                      title="Edit baris"
                                    >
                                      ✏️
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* ✅ MOBILE: Card View */}
                      <div className="mobile-view">
                        {record.items.map((item, idx) => (
                          <div key={`${record.id}-${idx}`} className="item-card">
                            <div className="item-card-header">
                              <span className="item-card-no">#{item.no}</span>
                              <span className="item-card-nama">{item.nama}</span>
                            </div>
                            <div className="item-card-body">
                              {editMode?.recordId === record.id && editMode.itemIndex === idx ? (
                                <>
                                  <div className="edit-row">
                                    <label>NIK:</label>
                                    <input
                                      type="text"
                                      value={editItem?.nik || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, nik: e.target.value } : null)}
                                      className="edit-input-mobile"
                                    />
                                  </div>
                                  <div className="edit-row">
                                    <label>Tgl:</label>
                                    <input
                                      type="date"
                                      value={editItem?.tglPengambilan || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, tglPengambilan: e.target.value } : null)}
                                      className="edit-input-mobile"
                                    />
                                  </div>
                                  <div className="edit-row">
                                    <label>Dept:</label>
                                    <input
                                      type="text"
                                      value={editItem?.dept || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, dept: e.target.value } : null)}
                                      className="edit-input-mobile"
                                    />
                                  </div>
                                  <div className="edit-row">
                                    <label>Job Desc:</label>
                                    <input
                                      type="text"
                                      value={editItem?.jobDesc || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, jobDesc: e.target.value } : null)}
                                      className="edit-input-mobile"
                                    />
                                  </div>
                                  <div className="edit-row">
                                    <label>Jumlah:</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={editItem?.jumlah || 1}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, jumlah: Number(e.target.value) } : null)}
                                      className="edit-input-mobile"
                                    />
                                  </div>
                                  <div className="edit-row">
                                    <label>Ket:</label>
                                    <input
                                      type="text"
                                      value={editItem?.keterangan || ""}
                                      onChange={(e) => setEditItem(prev => prev ? { ...prev, keterangan: e.target.value } : null)}
                                      className="edit-input-mobile"
                                    />
                                  </div>
                                  <div className="edit-actions-mobile">
                                    <button onClick={handleSaveEdit} className="save-btn-mobile">💾 Simpan</button>
                                    <button onClick={handleCancelEdit} className="cancel-btn-mobile">❌ Batal</button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="info-row">
                                    <span className="info-label">NIK:</span>
                                    <span className="info-value">{item.nik}</span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">Tgl:</span>
                                    <span className="info-value">{item.tglPengambilan}</span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">Dept:</span>
                                    <span className="info-value">{item.dept}</span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">Job Desc:</span>
                                    <span className="info-value">{item.jobDesc}</span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">Jumlah:</span>
                                    <span className="info-value">{item.jumlah}</span>
                                  </div>
                                  {item.keterangan && (
                                    <div className="info-row">
                                      <span className="info-label">Ket:</span>
                                      <span className="info-value">{item.keterangan}</span>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleEdit(record.id, idx, item)}
                                    className="edit-btn-mobile"
                                  >
                                    ✏️ Edit
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>👈 Pilih jenis APD di atas untuk melihat riwayat.</p>
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
          margin-left: 100px;
          padding: 24px;
          max-width: 1400px;
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
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          min-height: 44px;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-back-text {
          display: inline;
        }
.btn-download {
  padding: 10px 20px;
  background: #217346;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.3s;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.btn-download:hover {
  background: #1e6b40;
}
        .header-title {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          flex: 1;
        }

        .header-title h1 {
          margin: 0;
          font-size: inherit;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.95rem;
          color: #666;
          margin-bottom: 16px;
        }

        /* Filter Tanggal */
        .date-filter {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f5f9ff;
          border-radius: 8px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 200px;
        }

        .filter-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: #333;
        }

        .date-input {
          padding: 10px 12px;
          border: 1.5px solid #ccc;
          border-radius: 6px;
          font-size: 0.95rem;
          color: #333;
          min-height: 44px;
        }

        .clear-filter {
          padding: 10px 20px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          min-height: 44px;
          white-space: nowrap;
        }

        .clear-filter:hover {
          background: #d32f2f;
        }

        /* ✅ APD SELECTOR SECTION */
        .apd-selector-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .selector-title {
          margin: 0;
          font-size: 1.2rem;
          color: #0d47a1;
          font-weight: 700;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 300px;
          min-width: 200px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 10px 40px 10px 40px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 8px;
          background: #f1f5f9;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          font-size: 0.8rem;
        }

        .clear-search:hover {
          background: #e2e8f0;
        }

        .apd-buttons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          max-height: 400px;
          overflow-y: auto;
          padding: 4px;
        }

        .apd-type-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 48px;
          text-align: left;
        }

        .apd-type-btn:hover {
          border-color: #1e88e5;
          background: #f5f9ff;
          transform: translateY(-2px);
        }

        .apd-type-btn.active {
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          border-color: #1e88e5;
          color: white;
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
        }

        .apd-type-btn.no-data {
          opacity: 0.6;
          background: #f5f5f5;
        }

        .btn-label {
          flex: 1;
          font-size: 0.85rem;
          font-weight: 500;
          line-height: 1.3;
        }

        .btn-count {
          background: #1e88e5;
          color: white;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 12px;
          min-width: 20px;
          text-align: center;
          margin-left: 8px;
        }

        .apd-type-btn.active .btn-count {
          background: white;
          color: #1e88e5;
        }

        .no-results {
          text-align: center;
          padding: 20px;
          color: #64748b;
          font-size: 0.95rem;
        }

        .main-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 24px;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid #1e88e5;
          flex-wrap: wrap;
          gap: 12px;
        }

        .content-header h2 {
          margin: 0;
          color: #0d47a1;
          font-size: 1.4rem;
        }

        .btn-add {
          padding: 10px 20px;
          background: #1e88e5;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: background 0.3s;
          min-height: 44px;
          display: flex;
          align-items: center;
        }

        .btn-add:hover {
          background: #1565c0;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
          font-size: 1.1rem;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #e2e8f0;
          border-top-color: #1976d2;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .data-tables {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .data-section {
          border: 1.5px solid #eee;
          border-radius: 8px;
          overflow: hidden;
        }

        .section-header {
          background: #f5f9ff;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: #333;
          flex-wrap: wrap;
          gap: 12px;
        }

        .section-info {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .section-actions {
          display: flex;
          gap: 8px;
        }

        .delete-btn {
          background: none;
          border: none;
          font-size: 1.3rem;
          cursor: pointer;
          color: #f44336;
          transition: transform 0.2s;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .delete-btn:hover {
          transform: scale(1.1);
        }

        /* Desktop View */
        .desktop-view {
          display: block;
        }

        .mobile-view {
          display: none;
        }

        .apd-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .apd-table th,
        .apd-table td {
          padding: 12px 10px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .apd-table th {
          background: #e3f2fd;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
          white-space: nowrap;
        }

        .col-no { width: 50px; text-align: center; }
        .col-nama { min-width: 150px; }
        .col-nik { min-width: 120px; }
        .col-tgl { min-width: 110px; }
        .col-dept { min-width: 120px; }
        .col-job { min-width: 150px; }
        .col-jumlah { width: 60px; text-align: center; }
        .col-ket { min-width: 150px; }
        .col-aksi { width: 70px; text-align: center; }

        .edit-input {
          width: 100%;
          padding: 6px 8px;
          border: 1.5px solid #1e88e5;
          border-radius: 4px;
          font-size: 0.85rem;
          min-height: 36px;
        }

        .edit-btn,
        .save-btn,
        .cancel-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          min-width: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-btn:hover {
          background: #e3f2fd;
        }

        .save-btn {
          color: #4caf50;
        }

        .save-btn:hover {
          transform: scale(1.1);
        }

        .cancel-btn {
          color: #f44336;
        }

        .cancel-btn:hover {
          transform: scale(1.1);
        }

        .edit-actions {
          display: flex;
          gap: 4px;
          justify-content: center;
        }

        /* Mobile Card Styles */
        .item-card {
          background: white;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;
        }

        .item-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #f5f9ff;
          border-bottom: 1px solid #e0e0e0;
        }

        .item-card-no {
          background: #1e88e5;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .item-card-nama {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.95rem;
          flex: 1;
        }

        .item-card-body {
          padding: 14px;
        }

        .edit-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .edit-row label {
          font-weight: 600;
          font-size: 0.85rem;
          color: #666;
        }

        .edit-input-mobile {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #1e88e5;
          border-radius: 6px;
          font-size: 0.9rem;
          min-height: 44px;
        }

        .edit-actions-mobile {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .save-btn-mobile,
        .cancel-btn-mobile {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          min-height: 48px;
          font-size: 0.9rem;
        }

        .save-btn-mobile {
          background: #4caf50;
          color: white;
        }

        .cancel-btn-mobile {
          background: #f44336;
          color: white;
        }

        .edit-btn-mobile {
          width: 100%;
          padding: 12px 16px;
          background: #e3f2fd;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          min-height: 48px;
          font-size: 0.9rem;
          color: #1e88e5;
          margin-top: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          gap: 12px;
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: 600;
          font-size: 0.85rem;
          color: #666;
          min-width: 80px;
          flex-shrink: 0;
        }

        .info-value {
          font-size: 0.9rem;
          color: #1e293b;
          flex: 1;
          text-align: right;
        }

        /* ✅ TABLET RESPONSIVE (768px - 1024px) */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          .header-title h1 {
            font-size: 1.5rem;
          }

          .apd-buttons-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          }

          .search-container {
            max-width: 250px;
          }
        }

        /* ✅ MOBILE RESPONSIVE (≤ 768px) */
        @media (max-width: 768px) {
          .page-content {
            width: 100%;
            margin-left: 0;
            padding: 16px 12px;
          }

          .header-banner {
            padding: 12px 16px;
            flex-wrap: wrap;
          }

          .btn-back {
            width: auto;
            padding: 8px 12px;
          }

          .btn-back-text {
            display: none;
          }

          .header-title h1 {
            font-size: 1.3rem;
          }

          .user-info {
            font-size: 0.9rem;
          }

          .date-filter {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 12px;
          }

          .filter-group {
            width: 100%;
            min-width: 100%;
          }

          .date-input {
            font-size: 0.9rem;
            min-height: 48px;
          }

          .clear-filter {
            width: 100%;
            min-height: 48px;
          }

          .apd-selector-section {
            padding: 16px 12px;
          }

          .selector-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .selector-title {
            font-size: 1.1rem;
          }

          .search-container {
            max-width: 100%;
            min-width: 100%;
          }

          .search-input {
            font-size: 0.9rem;
            min-height: 48px;
          }

          .apd-buttons-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            max-height: 300px;
          }

          .apd-type-btn {
            padding: 10px 12px;
            min-height: 44px;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }

          .btn-label {
            font-size: 0.75rem;
            line-height: 1.2;
          }

          .btn-count {
            position: absolute;
            top: 8px;
            right: 8px;
          }

          .apd-type-btn {
            position: relative;
          }

          .main-content {
            padding: 16px 12px;
          }

          .content-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .btn-add {
            width: 100%;
            justify-content: center;
            min-height: 48px;
          }

          /* Hide desktop table, show mobile cards */
          .desktop-view {
            display: none;
          }

          .mobile-view {
            display: block;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 12px;
          }

          .section-info {
            flex-direction: column;
            gap: 6px;
          }

          .section-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .delete-btn {
            min-width: 48px;
            min-height: 48px;
          }

          .item-card-header {
            padding: 12px;
          }

          .item-card-no {
            padding: 3px 10px;
            font-size: 0.8rem;
          }

          .item-card-nama {
            font-size: 0.9rem;
          }

          .item-card-body {
            padding: 12px;
          }

          .edit-row {
            margin-bottom: 10px;
          }

          .edit-row label {
            font-size: 0.8rem;
          }

          .edit-input-mobile {
            min-height: 48px;
            font-size: 0.9rem;
          }

          .edit-actions-mobile {
            flex-direction: column;
            gap: 8px;
          }

          .save-btn-mobile,
          .cancel-btn-mobile {
            min-height: 52px;
          }

          .edit-btn-mobile {
            min-height: 48px;
          }

          .info-row {
            padding: 6px 0;
          }

          .info-label {
            min-width: 70px;
            font-size: 0.8rem;
          }

          .info-value {
            font-size: 0.85rem;
          }
        }

        /* ✅ SMALL MOBILE (≤ 480px) */
        @media (max-width: 480px) {
          .page-content {
            padding: 12px 8px;
          }

          .header-banner {
            padding: 10px 12px;
          }

          .header-title h1 {
            font-size: 1.1rem;
          }

          .btn-back {
            padding: 8px 10px;
            min-height: 40px;
          }

          .user-info {
            font-size: 0.85rem;
          }

          .date-filter {
            padding: 10px;
            gap: 10px;
          }

          .filter-group label {
            font-size: 0.85rem;
          }

          .date-input {
            font-size: 0.85rem;
            min-height: 44px;
            padding: 8px 10px;
          }

          .clear-filter {
            font-size: 0.85rem;
            min-height: 44px;
            padding: 10px 16px;
          }

          .apd-selector-section {
            padding: 12px 8px;
          }

          .selector-title {
            font-size: 1rem;
          }

          .search-input {
            font-size: 0.85rem;
            min-height: 44px;
            padding: 8px 36px;
          }

          .apd-buttons-grid {
            grid-template-columns: 1fr;
            gap: 6px;
            max-height: 250px;
          }

          .apd-type-btn {
            padding: 10px 12px;
            min-height: 44px;
          }

          .btn-label {
            font-size: 0.7rem;
          }

          .main-content {
            padding: 12px 8px;
          }

          .content-header h2 {
            font-size: 1.2rem;
          }

          .btn-add {
            font-size: 0.85rem;
            min-height: 44px;
          }

          .section-header {
            padding: 10px;
          }

          .section-info {
            gap: 4px;
          }

          .info-item {
            font-size: 0.8rem;
          }

          .item-card-header {
            padding: 10px;
          }

          .item-card-no {
            padding: 2px 8px;
            font-size: 0.75rem;
          }

          .item-card-nama {
            font-size: 0.85rem;
          }

          .item-card-body {
            padding: 10px;
          }

          .edit-row label {
            font-size: 0.75rem;
          }

          .edit-input-mobile {
            min-height: 44px;
            font-size: 0.85rem;
            padding: 8px 10px;
          }

          .save-btn-mobile,
          .cancel-btn-mobile {
            min-height: 48px;
            font-size: 0.85rem;
          }

          .edit-btn-mobile {
            min-height: 44px;
            font-size: 0.85rem;
          }

          .info-label {
            min-width: 60px;
            font-size: 0.75rem;
          }

          .info-value {
            font-size: 0.8rem;
          }

          .delete-btn {
            min-width: 44px;
            min-height: 44px;
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  )
}