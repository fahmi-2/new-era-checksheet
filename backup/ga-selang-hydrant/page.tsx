// /app/ga-selang-hydrant/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

interface HydrantItem {
  no: number
  zona: string
  jenisHydrant: string
  lokasi: string
  pic: string
}

export default function GaSelangHydrantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [isMounted, setIsMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user || (user.role !== "group-leader-qa" && user.role !== "inspector-ga")) {
      router.push("/login-page")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!isMounted || loading) return
    const openArea = searchParams.get("openArea")
    if (!openArea) return
    const found = hydrantList.find((item) => item.lokasi === openArea)
    if (found) {
      setTimeout(() => openDetail(found), 50)
    }
  }, [isMounted, loading, searchParams])

  const hydrantList: HydrantItem[] = [
    { no: 1, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "KANTIN", pic: "TIAN" },
    { no: 2, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "AUDITORIUM", pic: "TIAN" },
    { no: 3, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "MAIN OFFICE SISI SELATAN", pic: "TIAN" },
    { no: 4, zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", lokasi: "BELAKANG RAK KARTON BOX EXIM", pic: "TIAN" },
    { no: 5, zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", lokasi: "PINTU 9 CV 2B / GENBA A", pic: "TIAN" },
    { no: 6, zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", lokasi: "CV 4B GENBA A", pic: "TIAN" },
    { no: 7, zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", lokasi: "CV AT 8 GENBA A", pic: "TIAN" },
    { no: 8, zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", lokasi: "CV AT 11 GENBA A", pic: "TIAN" },
    { no: 9, zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", lokasi: "PINTU 7 GENBA A", pic: "TIAN" },
    { no: 10, zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", lokasi: "CV AT 18 GENBA A", pic: "TIAN" },
    { no: 11, zona: "UTARA", jenisHydrant: "HYDRANT INDOOR", lokasi: "NEW BUILDING WHS (RAK TOYOTA)", pic: "TIAN" },
    { no: 12, zona: "UTARA", jenisHydrant: "HYDRANT INDOOR", lokasi: "SAMPING LIFT BARANG WHS", pic: "YOGI" },
    { no: 13, zona: "UTARA", jenisHydrant: "HYDRANT INDOOR", lokasi: "OFFICE WHS", pic: "YOGI" },
    { no: 14, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "CV 12B / AREA BARAT", pic: "YOGI" },
    { no: 15, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "CV AB 10", pic: "YOGI" },
    { no: 16, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "CV AB 6", pic: "YOGI" },
    { no: 17, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "PINTU 1 GENBA A", pic: "YOGI" },
    { no: 18, zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", lokasi: "CV 8A", pic: "YOGI" },
    { no: 19, zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR", lokasi: "SUB ASSY B1", pic: "YOGI" },
    { no: 20, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "SUB ASSY C7", pic: "YOGI" },
    { no: 21, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "SHILD WIRE C4 / AREA TIMUR", pic: "YOGI" },
    { no: 22, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "RAYCHAM NPR.07", pic: "YOGI" },
    { no: 23, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "CV C5 / AREA BARAT", pic: "YOGI" },
    { no: 24, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "TRAINING ROOM", pic: "YOGI" },
    { no: 25, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "JIG PROTO / STOCK MATERIAL", pic: "YOGI" },
    { no: 26, zona: "BARAT", jenisHydrant: "HYDRANT INDOOR", lokasi: "MEZZANINE SISI BARAT", pic: "TIAN" },
    { no: 27, zona: "BARAT", jenisHydrant: "HYDRANT PILLAR", lokasi: "DEPAN MASJID", pic: "YOGI" },
    { no: 28, zona: "BARAT", jenisHydrant: "HYDRANT PILLAR", lokasi: "DEPAN GENBA C", pic: "YOGI" },
    { no: 29, zona: "BARAT", jenisHydrant: "HYDRANT PILLAR", lokasi: "SAMPING PUMP ROOM", pic: "YOGI" },
    { no: 30, zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR", lokasi: "SAMPING LOADING DOCK WH", pic: "YOGI" },
    { no: 31, zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR", lokasi: "SEBELAH UTARA PINTU 8", pic: "TIAN" },
    { no: 32, zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR", lokasi: "SAMPING LOADING DOCK EXIM", pic: "TIAN" },
    { no: 33, zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR", lokasi: "DEPAN AREA PARKIR", pic: "TIAN" },
    { no: 34, zona: "SELATAN", jenisHydrant: "HYDRANT INDOOR", lokasi: "PARKIR BAWAH", pic: "TIAN" },
    { no: 35, zona: "SELATAN", jenisHydrant: "HYDRANT INDOOR", lokasi: "PARKIR ATAS", pic: "TIAN" },
    { no: 36, zona: "UTARA", jenisHydrant: "HYDRANT FOAM", lokasi: "DEPAN AREA POWER HOUSE / SAMPING GENBA C", pic: "TIAN" },
  ]

  const [selectedArea, setSelectedArea] = useState<HydrantItem | null>(null)
  const [checksheetData, setChecksheetData] = useState<any | null>(null)
  const [selectedDateInModal, setSelectedDateInModal] = useState<string>("")
  const [availableDates, setAvailableDates] = useState<string[]>([])

  const openDetail = (area: HydrantItem) => {
    setSelectedArea(area)
    const key = `e-checksheet-slg-hydrant-${area.lokasi}`
    const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setChecksheetData(data)

        const allDates = new Set<string>()
        Object.values(data).forEach((entries: any) => {
          if (Array.isArray(entries)) {
            entries.forEach((entry: any) => {
              if (entry?.date) allDates.add(entry.date)
            })
          }
        })
        const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        setAvailableDates(sortedDates)
        setSelectedDateInModal(sortedDates[0] || "")
      } catch (e) {
        setChecksheetData(null)
        setAvailableDates([])
        setSelectedDateInModal("")
      }
    } else {
      setChecksheetData(null)
      setAvailableDates([])
      setSelectedDateInModal("")
    }
    setShowModal(true)
  }

  const closeDetail = () => {
    setSelectedArea(null)
    setChecksheetData(null)
    setSelectedDateInModal("")
    setAvailableDates([])
    setShowModal(false)
  }

  const inspectionItems = [
    { key: "pressureTank", label: "PRESSURE TANK (STD : 7 kg/cm2)" },
    { key: "hasilTekananDgPitot", label: "HASIL TEKANAN DG PITOT (STD : titik terjauh min. 4.5 kg/cm2)" },
    { key: "tekananEnginePump", label: "TEKANAN ENGINE PUMP" },
    { key: "fireHose", label: "FIRE HOSE / SELANG" },
    { key: "valve", label: "VALVE (TIDAK SERET)" },
    { key: "couplingNozzle", label: "COUPLING NOZZLE" },
    { key: "couplingHydrant", label: "COUPLING HYDRANT" },
    { key: "seal", label: "SEAL" },
  ]

  const filteredData = hydrantList.filter(item =>
    item.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.zona.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jenisHydrant.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isMounted) return null

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
    return null
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <NavbarStatic userName={user?.fullName || "User"} />
      <div style={{ padding: "20px 16px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            background: "linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)"
          }}>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700" }}>
              GA Selang & Hydrant
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "400" }}>
              Manajemen Data Inspeksi Selang & Hydrant – 2 Bulan Sekali
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          border: "1px solid #e8e8e8"
        }}>
          <input
            type="text"
            placeholder="Cari zona, jenis, atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #1e88e5",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#333",
              width: "100%"
            }}
          />
        </div>

        {/* Table */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid #e8e8e8"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "800px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>No</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Zona</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Jenis Hydrant</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Lokasi</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>PIC</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area) => {
                  const key = `e-checksheet-slg-hydrant-${area.lokasi}`
                  const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
                  let statusLabel = "Belum Ada Data"
                  let statusColor = "#9e9e9e"
                  let lastCheck = "-"

                  if (saved) {
                    try {
                      const data = JSON.parse(saved)
                      const allDates = new Set<string>()
                      Object.values(data).forEach((entries: any) => {
                        if (Array.isArray(entries)) {
                          entries.forEach((e: any) => allDates.add(e.date))
                        }
                      })
                      if (allDates.size > 0) {
                        const latest = Array.from(allDates).sort().pop()
                        lastCheck = new Date(latest!).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                        statusLabel = "Ada Data"
                        statusColor = "#4caf50"
                      }
                    } catch {}
                  }

                  return (
                    <tr key={area.no}>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center", fontWeight: "600" }}>{area.no}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontWeight: "500", color: "#1e88e5" }}>{area.zona}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", color: "#666", fontSize: "13px" }}>
                        <span style={{
                          padding: "4px 8px",
                          background: "#e3f2fd",
                          color: "#0d47a1",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}>
                          {area.jenisHydrant}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", color: "#666" }}>{area.lokasi}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center", fontWeight: "600", color: "#333" }}>{area.pic}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                        <span style={{
                          padding: "4px 12px",
                          background: statusColor,
                          color: "white",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}>
                          {statusLabel}
                        </span>
                        <br />
                        <span style={{ fontSize: "10px", color: "#999" }}>{lastCheck}</span>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => openDetail(area)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background: "#1e88e5",
                              color: "white",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            DETAIL
                          </button>
                          <a
                            href={`/e-checksheet-slg-hydrant?lokasi=${encodeURIComponent(area.lokasi)}&zona=${encodeURIComponent(area.zona)}&jenisHydrant=${encodeURIComponent(area.jenisHydrant)}&pic=${encodeURIComponent(area.pic)}`}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background: "#4caf50",
                              color: "white",
                              textDecoration: "none",
                              display: "inline-block"
                            }}
                          >
                            CHECK
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail */}
        {showModal && selectedArea && (
          <div
            onClick={closeDetail}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                width: "95%",
                maxWidth: "1400px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "20px 24px",
                background: "#f5f7fa",
                borderBottom: "2px solid #e8e8e8"
              }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", color: "#0d47a1", fontSize: "20px", fontWeight: "700" }}>
                    Detail Selang & Hydrant
                  </h2>
                  <p style={{ margin: "4px 0", color: "#1e88e5", fontWeight: "500" }}>{selectedArea.lokasi}</p>
                  <p style={{ margin: "0", color: "#777", fontSize: "12px" }}>
                    Zona: {selectedArea.zona} | Jenis: {selectedArea.jenisHydrant} | PIC: {selectedArea.pic}
                  </p>
                </div>
                <button onClick={closeDetail} style={{ background: "none", border: "none", fontSize: "28px", cursor: "pointer", color: "#999" }}>×</button>
              </div>

              {/* Dropdown Tanggal */}
              <div style={{ padding: "12px 20px", background: "#f9f9f9", borderBottom: "1px solid #e0e0e0" }}>
                <label style={{ fontWeight: "600", color: "#0d47a1", marginRight: "12px", fontSize: "13px" }}>
                  Pilih Tanggal:
                </label>
                <select
                  value={selectedDateInModal}
                  onChange={(e) => setSelectedDateInModal(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #1e88e5",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    minWidth: "140px"
                  }}
                >
                  <option value="">-- Pilih Tanggal --</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                {!checksheetData ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999" }}>
                    Belum ada data pengecekan
                  </div>
                ) : !selectedDateInModal ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                    Pilih tanggal untuk melihat detail
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "1200px", border: "2px solid #0d47a1" }}>
                      <thead>
                        <tr style={{ background: "#e3f2fd" }}>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "50px" }}>No</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "200px" }}>ITEM</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>HASIL</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>KETERANGAN N-OK</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>PIC</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>DUE DATE</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>VERIFY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectionItems.map((item, index) => {
                          const entries = checksheetData[item.key] || []
                          const entry = entries.find((e: any) => e.date === selectedDateInModal)
                          return (
                            <tr key={item.key}>
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", lineHeight: "1.4" }}>{item.label}</td>
                              <td style={{
                                padding: "8px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontWeight: "700",
                                background: entry?.hasilPemeriksaan === "OK" ? "#c8e6c9" : entry?.hasilPemeriksaan === "NG" ? "#ffcdd2" : "#fff",
                                color: entry?.hasilPemeriksaan === "OK" ? "#2e7d32" : entry?.hasilPemeriksaan === "NG" ? "#c62828" : "#999"
                              }}>
                                {entry?.hasilPemeriksaan === "OK" ? "✓ OK" : entry?.hasilPemeriksaan === "NG" ? "✗ NG" : "-"}
                              </td>
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", lineHeight: "1.4" }}>{entry?.keteranganTemuan || "-"}</td>
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", lineHeight: "1.4" }}>{entry?.tindakanPerbaikan || "-"}</td>
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>{entry?.pic || "-"}</td>
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>
                                {entry?.dueDate ? new Date(entry.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                              </td>
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>{entry?.verify || "-"}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 20px", background: "#f5f7fa", borderTop: "1px solid #e8e8e8", textAlign: "right" }}>
                <button onClick={closeDetail} style={{ padding: "8px 20px", background: "#bdbdbd", color: "white", border: "none", borderRadius: "6px", fontWeight: "600" }}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}