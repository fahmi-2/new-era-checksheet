"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar"
import { ArrowLeft, Download, FileSpreadsheet, FileText, Filter, X, Eye, Tag, CheckSquare, Square, ShieldCheck } from "lucide-react"

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

type DownloadFormat = "excel" | "pdf"

interface ColumnConfig {
  key: keyof ApdItem
  label: string
  selected: boolean
}

export default function DownloadLaporanPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [records, setRecords] = useState<ApdRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedApdType, setSelectedApdType] = useState<string>("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: "no", label: "No", selected: true },
    { key: "nama", label: "Nama", selected: true },
    { key: "nik", label: "NIK", selected: true },
    { key: "tglPengambilan", label: "Tanggal", selected: true },
    { key: "dept", label: "Departemen", selected: true },
    { key: "jobDesc", label: "Job Desc", selected: true },
    { key: "jumlah", label: "Jumlah", selected: true },
    { key: "keterangan", label: "Keterangan", selected: false },
  ])

  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const apdTypes = [
    "SARUNG TANGAN BINTIL", "SARUNG TANGAN KATUN", "SARUNG TANGAN KULIT",
    "SARUNG TANGAN GREEN NITRIL", "SARUNG TANGAN LAS", "SARUNG TANGAN RESISTANCE",
    "SARUNG TANGAN SHOWA BO500", "SARUNG TANGAN SHOWA 380",
    "SARUNG TANGAN PU (COMET) (KHUSUS OA)", "MASKER KAIN", "MASKER FKA",
    "MASKER 3M-3200", "CATRIDGE 3M-3303K-10", "MASKER 3M-8515 (N950)",
    "KACAMATA GERINDRA", "KACAMATA LAS KING", "CELEMEK SAKU",
    "CELEMEK TANPA SAKU", "CELEMEK KULIT", "CELEMEK SISUI",
    "CELEMEK DIP SOLDER", "CELEMEK RAYCHEM", "SAFETY SHOES KWD 901X",
    "SAFETY SHOES KWD 301X", "SAFETY SHOES KWS 200X", "SAFETY SHOES KWS 205CX",
    "NPR L-026 & L-026X", "TOPENG LAS", "VISOR HOLDER",
    "VISOR HOLDER FC48, ANSI Z87+", "FACE SHIELD", "EAR MUFF",
    "SLEAVE", "HELMET", "HELM SUSPENSION", "TALI HELMET",
    "CATLEPACK", "FULL BODY HARNESS", "EAR PLUG", "TOPI PELINDUNG",
    "BACK SUPPORT", "SAFETY HELMET KETINGGIAN", "SAFETY VEST",
  ]

  useEffect(() => {
    if (!user || !isAuthorizedForChecksheet(user)) {
      router.push("/home")
    }
  }, [user, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filterDateFrom) queryParams.append("date_from", filterDateFrom)
      if (filterDateTo) queryParams.append("date_to", filterDateTo)
      queryParams.append("limit", "1000")
      queryParams.append("offset", "0")

      const response = await fetch(`/e-checksheet-ga/api/apd/history?${queryParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) setRecords(data.data || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadData()
  }, [user])

  const handleGeneratePreview = () => {
    const filteredRecords = selectedApdType
      ? records.filter((r) => r.jenisApd === selectedApdType)
      : records

    const flattenedData: any[] = []
    filteredRecords.forEach((record) => {
      record.items.forEach((item) => {
        flattenedData.push({ jenisApd: record.jenisApd, checker: record.checker, submittedAt: record.submittedAt, ...item })
      })
    })

    setPreviewData(flattenedData)
    setShowPreview(true)
  }

  const handleDownload = async (format: DownloadFormat) => {
    try {
      setDownloading(true)
      const selectedColumns = columns.filter((c) => c.selected).map((c) => c.key)
      const response = await fetch("/e-checksheet-ga/api/apd/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          columns: selectedColumns,
          apdType: selectedApdType,
          dateFrom: filterDateFrom,
          dateTo: filterDateTo,
          previewData,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `Laporan_APD_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "pdf"}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Gagal download laporan")
      }
    } catch (error) {
      console.error("Download error:", error)
      alert("Terjadi kesalahan saat download")
    } finally {
      setDownloading(false)
    }
  }

  const toggleColumn = (key: keyof ApdItem) => {
    setColumns(columns.map((col) => (col.key === key ? { ...col, selected: !col.selected } : col)))
  }

  if (!user) return null

  const activeColCount = columns.filter((c) => c.selected).length
  const uniqueTypes = selectedApdType ? 1 : [...new Set(records.map((r) => r.jenisApd))].length

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">

        {/* ── Header ── */}
        <div className="page-header">
          <button onClick={() => router.push("/status-ga/e-checksheet-apd/riwayat-apd")} className="back-btn">
            <ArrowLeft size={15} />
            Kembali
          </button>
          <div className="header-info">
            <h1>Download laporan APD</h1>
            <p>Filter, preview, lalu unduh dalam format pilihan</p>
          </div>
          <div className="header-badge">
            <ShieldCheck size={14} />
            GA Personal
          </div>
        </div>

        <div className="main-stack">

          {/* ── Step 1: Filter & Kolom ── */}
          <div className="card">
            <div className="step-label">
              <div className="step-num">1</div>
              <span className="step-title">Filter data &amp; pilih kolom</span>
            </div>

            {/* Filter row */}
            <div className="filter-row">
              <div className="field-group">
                <label className="field-label">Jenis APD</label>
                <select
                  value={selectedApdType}
                  onChange={(e) => setSelectedApdType(e.target.value)}
                  className="field-input"
                >
                  <option value="">Semua APD</option>
                  {apdTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Dari tanggal</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="field-input"
                />
              </div>
              <div className="field-group">
                <label className="field-label">Sampai tanggal</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>

            <div className="divider" />

            <p className="mini-title">Kolom yang ditampilkan</p>
            <div className="col-grid">
              {columns.map((col) => (
                <button
                  key={col.key}
                  className={`col-chip ${col.selected ? "on" : ""}`}
                  onClick={() => toggleColumn(col.key)}
                >
                  {col.selected ? <CheckSquare size={14} /> : <Square size={14} />}
                  {col.label}
                </button>
              ))}
            </div>

            <button
              className="preview-btn"
              onClick={handleGeneratePreview}
              disabled={loading}
            >
              <Eye size={16} />
              {loading ? "Memuat..." : "Generate preview"}
            </button>
          </div>

          {/* ── Step 2: Preview ── */}
          {showPreview && (
            <div className="card">
              <div className="step-label">
                <div className="step-num done">2</div>
                <span className="step-title">Preview &amp; unduh</span>
                <button className="close-btn" onClick={() => setShowPreview(false)} aria-label="Tutup preview">
                  <X size={16} />
                </button>
              </div>

              {/* Stats */}
              <div className="stats-row">
                <div className="stat-pill">
                  <div className="stat-val">{previewData.length}</div>
                  <div className="stat-lbl">Total baris</div>
                </div>
                <div className="stat-pill">
                  <div className="stat-val">{activeColCount}</div>
                  <div className="stat-lbl">Kolom aktif</div>
                </div>
                <div className="stat-pill">
                  <div className="stat-val">{uniqueTypes}</div>
                  <div className="stat-lbl">Jenis APD</div>
                </div>
              </div>

              {/* APD badge */}
              <div className="apd-badge-wrap">
                <span className="apd-badge">
                  <Tag size={11} />
                  {selectedApdType || "Semua APD"}
                </span>
              </div>

              {/* Table */}
              <div className="table-wrap">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {columns.filter((c) => c.selected).map((col) => (
                        <th key={col.key}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((row, idx) => (
                      <tr key={idx}>
                        {columns.filter((c) => c.selected).map((col) => (
                          <td key={col.key}>
                            {col.key === "tglPengambilan"
                              ? new Date(row[col.key]).toLocaleDateString("id-ID")
                              : row[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <p className="more-note">
                    Menampilkan 10 dari {previewData.length} data. Unduh untuk melihat semua.
                  </p>
                )}
              </div>

              {/* Download buttons */}
              <div className="dl-row">
                <button
                  className="dl-btn dl-excel"
                  onClick={() => handleDownload("excel")}
                  disabled={downloading}
                >
                  <FileSpreadsheet size={17} />
                  {downloading ? "Downloading..." : "Download Excel"}
                </button>
                <button
                  className="dl-btn dl-pdf"
                  onClick={() => handleDownload("pdf")}
                  disabled={downloading}
                >
                  <FileText size={17} />
                  {downloading ? "Downloading..." : "Download PDF"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* ── Layout ── */
        .app-page {
          display: flex;
          min-height: 100vh;
          background: #f0f4f8;
        }
        .page-content {
          flex: 1;
          margin-left: 100px;
          padding: 24px;
          max-width: 1200px;
        }

        /* ── Header ── */
        .page-header {
          background: #042C53;
          border-radius: 14px;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .back-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          color: #fff; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .back-btn:hover { background: rgba(255,255,255,0.2); }
        .header-info { flex: 1; }
        .header-info h1 { margin: 0; font-size: 18px; font-weight: 600; color: #fff; }
        .header-info p { margin: 3px 0 0; font-size: 12px; color: #85B7EB; }
        .header-badge {
          display: flex; align-items: center; gap: 6px;
          background: #185FA5;
          border-radius: 8px;
          padding: 7px 13px;
          font-size: 12px; color: #B5D4F4; font-weight: 500;
          white-space: nowrap;
        }

        /* ── Cards ── */
        .main-stack { display: flex; flex-direction: column; gap: 20px; }
        .card {
          background: #fff;
          border: 1px solid #e4eaf2;
          border-radius: 14px;
          padding: 22px 24px;
        }

        /* ── Step label ── */
        .step-label {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 18px;
        }
        .step-num {
          width: 26px; height: 26px;
          background: #042C53; color: #fff;
          border-radius: 50%; font-size: 12px; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .step-num.done { background: #0F6E56; }
        .step-title { font-size: 15px; font-weight: 600; color: #1a2a3a; }
        .close-btn {
          margin-left: auto; background: none; border: none; cursor: pointer;
          color: #8a9bb0; padding: 4px; border-radius: 6px;
          display: flex; align-items: center;
          transition: background 0.15s;
        }
        .close-btn:hover { background: #f0f4f8; color: #374151; }

        /* ── Filters ── */
        .filter-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }
        .field-group { display: flex; flex-direction: column; gap: 5px; }
        .field-label {
          font-size: 11px; font-weight: 600; color: #7a90a8;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .field-input {
          padding: 9px 11px;
          border: 1.5px solid #dce6f0;
          border-radius: 8px;
          font-size: 13px;
          background: #f7fafd;
          color: #1a2a3a;
          transition: border-color 0.15s;
        }
        .field-input:focus { outline: none; border-color: #378ADD; background: #fff; }

        /* ── Divider ── */
        .divider { height: 1px; background: #edf1f7; margin: 0 0 16px; }

        /* ── Column chips ── */
        .mini-title {
          font-size: 11px; font-weight: 600; color: #7a90a8;
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: 10px;
        }
        .col-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 8px;
          margin-bottom: 18px;
        }
        .col-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 11px;
          border: 1.5px solid #dce6f0;
          border-radius: 8px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          background: #f7fafd;
          color: #7a90a8;
          transition: all 0.15s;
        }
        .col-chip:hover { border-color: #378ADD; color: #185FA5; }
        .col-chip.on {
          background: #E6F1FB; border-color: #378ADD; color: #0C447C;
        }

        /* ── Preview button ── */
        .preview-btn {
          width: 100%; padding: 11px;
          background: #042C53; color: #fff;
          border: none; border-radius: 9px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s;
        }
        .preview-btn:hover:not(:disabled) { background: #0C447C; }
        .preview-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Stats ── */
        .stats-row {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-bottom: 14px;
        }
        .stat-pill {
          background: #f5f8fc;
          border-radius: 10px;
          padding: 12px 14px; text-align: center;
        }
        .stat-val { font-size: 22px; font-weight: 700; color: #042C53; }
        .stat-lbl { font-size: 11px; color: #7a90a8; margin-top: 2px; }

        /* ── APD Badge ── */
        .apd-badge-wrap { margin-bottom: 14px; }
        .apd-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: #E6F1FB; color: #0C447C;
          border-radius: 7px; padding: 4px 10px;
          font-size: 12px; font-weight: 500;
        }

        /* ── Table ── */
        .table-wrap {
          border: 1px solid #e4eaf2;
          border-radius: 10px; overflow: hidden;
          margin-bottom: 16px;
        }
        .preview-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .preview-table thead { background: #E6F1FB; }
        .preview-table th {
          padding: 10px 12px; text-align: left;
          font-weight: 600; color: #0C447C; white-space: nowrap;
        }
        .preview-table td {
          padding: 10px 12px; color: #2d3f53;
          border-top: 1px solid #edf1f7;
        }
        .preview-table tr:hover td { background: #f7fafd; }
        .more-note {
          text-align: center; padding: 10px;
          font-size: 12px; color: #7a90a8; font-style: italic;
          background: #f7fafd; border-top: 1px solid #edf1f7;
        }

        /* ── Download buttons ── */
        .dl-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dl-btn {
          padding: 12px 18px;
          border: none; border-radius: 9px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: filter 0.15s, transform 0.1s;
        }
        .dl-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .dl-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .dl-excel { background: #1e6b40; color: #fff; }
        .dl-pdf { background: #A32D2D; color: #fff; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .page-content { margin-left: 0; padding: 14px; }
          .filter-row { grid-template-columns: 1fr; }
          .stats-row { grid-template-columns: repeat(3, 1fr); }
          .dl-row { grid-template-columns: 1fr; }
          .header-badge { display: none; }
        }
      `}</style>
    </div>
  )
}