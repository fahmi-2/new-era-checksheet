"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

// 🔹 Tipe Data Panel
interface PanelItem {
  no: number
  namaPanel: string
  area: string
}

// 🔹 Tipe Data Hasil E-Checksheet
interface ChecksheetResult {
  _savedAt?: string
  tempC: string
  tempCableConnect: string
  tempCable: string
  bau: string
  suara: string
  sistemGrounding: string
  kondisiKabelIsolasi: string
  indikatorPanel: string
  elcb: string
  safetyWarning: string
  kondisiSambunganR: string
  kondisiSambunganS: string
  kondisiSambunganT: string
  boxPanel: string
  s5: string
  keteranganNg1: string
  keteranganNg2: string
  keteranganNg3: string
  keteranganNg4: string
  tindakanPerbaikan1: string
  tindakanPerbaikan2: string
  tindakanPerbaikan3: string
  tindakanPerbaikan4: string
  tindakanPerbaikan5: string
  pic1: string
  pic2: string
  dueDate1: string
  dueDate2: string
  verifikasi1: string
  verifikasi2: string
}

export default function GaPanelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user || (user.role !== "group-leader-qa" && user.role !== "inspector-ga")) {
      router.push("/login-page")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (loading) return
    const openPanel = searchParams.get("openPanel")
    if (!openPanel) return
    const found = panels.find((p) => p.namaPanel === openPanel)
    if (found) {
      setTimeout(() => openDetail(found), 50)
    }
  }, [searchParams, loading])

  const panels: PanelItem[] = [
    { no: 1, namaPanel: "MCC Sump 1", area: "Pintu 3 Genba A" },
    { no: 2, namaPanel: "MCC Sump 2", area: "Pintu 1 Genba A" },
    { no: 3, namaPanel: "MCC Sump 3", area: "Samping Meeting Room" },
    { no: 4, namaPanel: "MCC Sump 4", area: "Toilet Security" },
    { no: 5, namaPanel: "MCC Sump 5", area: "Toilet Wanita D" },
    { no: 6, namaPanel: "MCC Sump 6", area: "Pintu 9" },
    { no: 7, namaPanel: "MCC Sump 7", area: "Parkir Mobil" },
    { no: 8, namaPanel: "MCC Sump Main Office", area: "Polytainer Exim" },
    { no: 9, namaPanel: "sump new (auditorium)", area: "Submersible Pump Control Panel" },
    { no: 10, namaPanel: "LP OLP - 1", area: "Loading Dock Warehouse" },
    { no: 11, namaPanel: "LP OLP - 2", area: "Samping Masjid" },
    { no: 12, namaPanel: "LP Training", area: "Training Room" },
    { no: 13, namaPanel: "LP Kantin", area: "Kantin Room" },
    { no: 14, namaPanel: "PP Dep Well", area: "TPA" },
    { no: 15, namaPanel: "STP", area: "IPAL" },
    { no: 16, namaPanel: "PP Computer", area: "Main Office" },
    { no: 17, namaPanel: "PP/LP Office", area: "Main Office" },
    { no: 18, namaPanel: "LP GH", area: "Pos Security" },
    { no: 19, namaPanel: "Workshop", area: "Workshop" },
    { no: 20, namaPanel: "Segitiga", area: "Area Segitiga" },
    { no: 21, namaPanel: "IPAL", area: "IPAL" },
    { no: 22, namaPanel: "Locker", area: "Locker" },
    { no: 23, namaPanel: "Kipas A", area: "Samping Jalan sisi timur genba C" },
    { no: 24, namaPanel: "Kipas B", area: "Samping Jalan sisi barat genba C" },
    { no: 25, namaPanel: "Kipas C", area: "Samping Jalan sisi barat genba C" },
    { no: 26, namaPanel: "Kipas D", area: "Samping Jalan sisi timur genba C" },
    { no: 27, namaPanel: "Kipas A", area: "Samping Jalan sisi utara genba B" },
    { no: 28, namaPanel: "Kipas B", area: "Samping Jalan sisi utara genba B" },
    { no: 29, namaPanel: "Kipas C", area: "Samping Jalan sisi utara genba B" },
    { no: 30, namaPanel: "Kipas D", area: "Samping Jalan sisi utara genba B" },
    { no: 31, namaPanel: "Kipas E", area: "" },
    { no: 32, namaPanel: "Second Floor Genba B (220)", area: "Samping Lift Barang" },
    { no: 33, namaPanel: "Submersible Pump (Air AC)", area: "Mezzanine Genba A" },
    { no: 34, namaPanel: "Portal Jalan Genba B", area: "Karton Box Exim" },
    { no: 35, namaPanel: "Lampu Rest Area / LP4", area: "Depan Toilet A Pria" },
    { no: 36, namaPanel: "AC Indoor", area: "Dalam genba C sisi utara jendela" },
    { no: 37, namaPanel: "AC Outdoor : PP-PAC-1 (OUTDOOR)", area: "Depan Power House Genba A" },
  ]

  const [selectedPanel, setSelectedPanel] = useState<PanelItem | null>(null)
  const [checksheetData, setChecksheetData] = useState<ChecksheetResult[] | null>(null)
  const [savedDates, setSavedDates] = useState<Record<string, string>>({})

  // Helper: format tanggal Indonesia
  const formatDate = (dateString: string): string => {
    if (!dateString) return "-"
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return "-"
    return d.toLocaleDateString("id-ID") // contoh: 12/01/2026
  }

  const openDetail = (panel: PanelItem) => {
    setSelectedPanel(panel)
    const key = `e-checksheet-panel-${panel.namaPanel}`
    const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (Array.isArray(data)) {
          setChecksheetData(data)
        } else {
          setChecksheetData([data])
        }
      } catch (e) {
        setChecksheetData(null)
      }
    } else {
      setChecksheetData(null)
    }
  }

  const closeDetail = () => {
    setSelectedPanel(null)
    setChecksheetData(null)
  }

  // Populate savedDates from localStorage on client only
  useEffect(() => {
    if (typeof window === "undefined") return
    const map: Record<string, string> = {}
    panels.forEach((panel) => {
      try {
        const key = `e-checksheet-panel-${panel.namaPanel}`
        const saved = localStorage.getItem(key)
        if (saved) {
          const data = JSON.parse(saved)
          map[panel.namaPanel] = formatDate(data?._savedAt || "")
        } else {
          map[panel.namaPanel] = "-"
        }
      } catch (e) {
        map[panel.namaPanel] = "-"
      }
    })
    setSavedDates(map)
  }, [])

  return (
    <div className="app-page">
      <NavbarStatic userName={user?.fullName || "User"} />
      <div className="page-content">
        <div className="header">
          <h1>GA Panel Inspection</h1>
        </div>

        <div className="table-wrapper">
          <table className="status-table">
            <thead>
              <tr>
                <th className="col-tanggal">Tanggal</th>
                <th className="col-no">No</th>
                <th className="col-nama-panel">Nama Panel</th>
                <th className="col-area">Area</th>
                <th className="col-status">Status</th>
                <th className="col-check">CHECK</th>
              </tr>
            </thead>
            <tbody>
              {panels.map((panel) => {
                const savedDate = savedDates[panel.namaPanel] || "-"

                return (
                  <tr key={panel.no}>
                    <td className="col-tanggal">{savedDate}</td>
                    <td className="col-no">{panel.no}</td>
                    <td className="col-nama-panel">{panel.namaPanel}</td>
                    <td className="col-area">{panel.area}</td>
                    <td className="col-status">
                      <button onClick={() => openDetail(panel)} className="btn-detail">
                        DETAIL
                      </button>
                    </td>
                    <td className="col-check">
                      <a
                        href={`/e-checksheet-panel?panelName=${encodeURIComponent(panel.namaPanel)}&area=${encodeURIComponent(panel.area)}&date=${new Date().toISOString().split('T')[0]}`}
                        className="btn-check"
                      >
                        CHECK
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Detail */}
        {selectedPanel && (
          <div className="modal-overlay" onClick={closeDetail}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detail Panel: {selectedPanel.namaPanel}</h2>
                <button onClick={closeDetail} className="btn-close">×</button>
              </div>
              <div className="modal-body">
                {(!checksheetData || checksheetData.length === 0) ? (
                  <p style={{ textAlign: "center", color: "#666" }}>Belum ada data pengecekan.</p>
                ) : (
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Temp (°C)</th>
                        <th>Temp Cable Connect</th>
                        <th>Temp Cable</th>
                        <th>Bau</th>
                        <th>Suara</th>
                        <th>Sistem Grounding</th>
                        <th>Kondisi Kabel & Isolasi</th>
                        <th>Indikator Panel</th>
                        <th>ELCB</th>
                        <th>Safety Warning</th>
                        <th>R</th>
                        <th>S</th>
                        <th>T</th>
                        <th>Box Panel</th>
                        <th>5S</th>
                        <th>KETERANGAN N-OK</th>
                        <th>TINDAKAN PERBAIKAN</th>
                        <th>PIC</th>
                        <th>DUE DATE</th>
                        <th>VERIFIKASI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checksheetData!.map((entry, idx) => (
                        <tr key={idx}>
                          <td>{formatDate(entry._savedAt || "")}</td>
                          <td>{entry.tempC || "-"}</td>
                          <td>{entry.tempCableConnect || "-"}</td>
                          <td>{entry.tempCable || "-"}</td>
                          <td>{entry.bau || "-"}</td>
                          <td>{entry.suara || "-"}</td>
                          <td>{entry.sistemGrounding || "-"}</td>
                          <td>{entry.kondisiKabelIsolasi || "-"}</td>
                          <td>{entry.indikatorPanel || "-"}</td>
                          <td>{entry.elcb || "-"}</td>
                          <td>{entry.safetyWarning || "-"}</td>
                          <td>{entry.kondisiSambunganR || "-"}</td>
                          <td>{entry.kondisiSambunganS || "-"}</td>
                          <td>{entry.kondisiSambunganT || "-"}</td>
                          <td>{entry.boxPanel || "-"}</td>
                          <td>{entry.s5 || "-"}</td>
                          <td>{entry.keteranganNg1 || "-"}</td>
                          <td>{entry.tindakanPerbaikan1 || "-"}</td>
                          <td>{entry.pic1 || "-"}</td>
                          <td>{entry.dueDate1 || "-"}</td>
                          <td>{entry.verifikasi1 || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={closeDetail} className="btn-cancel">Tutup</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .app-page {
          min-height: 100vh;
          background: #f5f5f5;
        }
        .page-content {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .header h1 {
          margin: 0;
          color: #0d47a1;
          font-size: 1.6rem;
        }
        .table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .status-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          font-size: 0.85rem;
        }
        .status-table th,
        .status-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid #e0e0e0;
          vertical-align: middle;
        }
        .status-table th {
          background: #f5f9ff;
          font-weight: 700;
          font-size: 14px;
        }
        .col-tanggal {
          width: 120px;
          text-align: center;
          white-space: nowrap;
        }
        .col-no {
          width: 60px;
          text-align: center;
        }
        .col-nama-panel,
        .col-area {
          min-width: 200px;
        }
        .col-status,
        .col-check {
          width: 100px;
          text-align: center;
        }
        .btn-detail,
        .btn-check {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 0.85rem;
          text-decoration: none;
          font-weight: bold;
          cursor: pointer;
        }
        .btn-detail {
          background: #1e88e5;
          color: white;
        }
        .btn-detail:hover {
          background: #0d47a1;
        }
        .btn-check {
          background: #4caf50;
          color: white;
        }
        .btn-check:hover {
          background: #388e3c;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          border-radius: 8px;
          width: 95%;
          max-width: 1200px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: #f5f9ff;
          border-bottom: 1px solid #ddd;
        }
        .modal-header h2 {
          margin: 0;
          color: #0d47a1;
          font-size: 1.2rem;
        }
        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }
        .btn-close:hover {
          color: #d32f2f;
        }
        .modal-body {
          padding: 24px;
        }
        .detail-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .detail-table th,
        .detail-table td {
          padding: 8px;
          border: 1px solid #e0e0e0;
          text-align: center;
        }
        .detail-table th {
          background: #f5f9ff;
          font-weight: 600;
          font-size: 0.8rem;
          word-wrap: break-word;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 24px;
          background: #f5f9ff;
          border-top: 1px solid #ddd;
        }
        .btn-cancel {
          padding: 8px 16px;
          background: #bdbdbd;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .btn-cancel:hover {
          background: #757575;
        }
      `}</style>
    </div>
  )
}