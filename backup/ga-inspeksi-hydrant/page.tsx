// /app/ga-inspeksi-hydrant/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

interface HydrantItem {
  no: number
  lokasi: string
  zona: string
  jenisHydrant: string
}

// Data hydrant dari cs-inpeksi-hydrant.xlsx
const HYDRANT_LIST: HydrantItem[] = [
  { no: 1, lokasi: "KANTIN", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 2, lokasi: "AUDITORIUM", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 3, lokasi: "MAIN OFFICE SISI SELATAN", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 4, lokasi: "BELAKANG RAK KARTON BOX EXIM", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 5, lokasi: "PINTU 9 CV 2B / GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 6, lokasi: "CV AT6 GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 7, lokasi: "CV AT7 GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 8, lokasi: "CV AT 11 GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 9, lokasi: "PINTU 7 GENBA A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 10, lokasi: "SEBELAH UTARA PINTU 7", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 11, lokasi: "NEW BUILDING WHS (RAK TOYOTA)", zona: "UTARA", jenisHydrant: "HYDRANT INDOOR" },
  { no: 12, lokasi: "SAMPING LIFT BARANG WHS", zona: "UTARA", jenisHydrant: "HYDRANT INDOOR" },
  { no: 13, lokasi: "OFFICE WHS", zona: "UTARA", jenisHydrant: "HYDRANT INDOOR" },
  { no: 14, lokasi: "CV 12B / AREA BARAT", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 15, lokasi: "CV AB 10", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 16, lokasi: "CV AB 5", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 17, lokasi: "PINTU 1 GENBA A", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 18, lokasi: "CV 8A", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 19, lokasi: "SUB ASSY B1", zona: "TIMUR", jenisHydrant: "HYDRANT INDOOR" },
  { no: 20, lokasi: "SUB ASSY C7", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 21, lokasi: "SHILD WIRE C4  / AREA TIMUR", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 22, lokasi: "RAYCHAM NPR.07", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 23, lokasi: "CV 5A M/S / AREA BARAT", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 24, lokasi: "TRAINING ROOM", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 25, lokasi: "JIG PROTO / STOCK MATERIAL", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 26, lokasi: "MEZZANINE SISI BARAT", zona: "BARAT", jenisHydrant: "HYDRANT INDOOR" },
  { no: 27, lokasi: "DEPAN MASJID", zona: "BARAT", jenisHydrant: "HYDRANT PILLAR" },
  { no: 28, lokasi: "DEPAN GENBA C", zona: "BARAT", jenisHydrant: "HYDRANT PILLAR" },
  { no: 29, lokasi: "SAMPING PUMP ROOM", zona: "BARAT", jenisHydrant: "HYDRANT PILLAR" },
  { no: 30, lokasi: "SAMPING LOADING DOCK WH", zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR" },
  { no: 31, lokasi: "SEBELAH UTARA PINTU 8", zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR" },
  { no: 32, lokasi: "SAMPING LOADING DOCK EXIM", zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR" },
  { no: 33, lokasi: "DEPAN AREA PARKIR", zona: "TIMUR", jenisHydrant: "HYDRANT PILLAR" },
  { no: 34, lokasi: "PARKIR BAWAH", zona: "SELATAN", jenisHydrant: "HYDRANT INDOOR" },
  { no: 35, lokasi: "PARKIR ATAS", zona: "SELATAN", jenisHydrant: "HYDRANT INDOOR" },
  { no: 36, lokasi: "DEPAN POWER HOUSE A", zona: "UTARA", jenisHydrant: "HYDRANT OUTDOOR" },
]

export default function GaInspeksiHydrantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [isMounted, setIsMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("HYDRANT INDOOR")
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

  // Filter by category + search
  const filteredData = HYDRANT_LIST.filter(item =>
    item.jenisHydrant === selectedCategory &&
    (item.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.zona.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const [selectedArea, setSelectedArea] = useState<HydrantItem | null>(null)
  const [checksheetData, setChecksheetData] = useState<any | null>(null)
  const [selectedDateInModal, setSelectedDateInModal] = useState<string>("")
  const [availableDates, setAvailableDates] = useState<string[]>([])

  const openDetail = (area: HydrantItem) => {
    setSelectedArea(area)
    const key = `e-checksheet-hydrant-${area.no}`
    const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setChecksheetData(data)

        const allDates = new Set<string>()
        if (Array.isArray(data)) {
          data.forEach((entry: any) => {
            if (entry?.date) allDates.add(entry.date)
          })
        }
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
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <NavbarStatic userName={user?.fullName || "User"} />
      <div style={{ padding: "24px 20px", maxWidth: "1400px", margin: "0 auto" }}>
        
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "24px 28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              🚒 Hydrant Inspection Dashboard
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px", fontWeight: "400" }}>
              Monthly inspection schedule and maintenance records
            </p>
          </div>
        </div>

        {/* Dropdown + Search */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "flex-end"
        }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label htmlFor="category-select" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
              Hydrant Type:
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                border: "1px solid #d0d0d0",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333",
                outline: "none",
                fontFamily: "inherit"
              }}
            >
              <option value="HYDRANT INDOOR">HYDRANT INDOOR</option>
              <option value="HYDRANT PILLAR">HYDRANT PILLAR</option>
              <option value="HYDRANT OUTDOOR">HYDRANT OUTDOOR</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <label htmlFor="search-input" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
              Search Location or Zone:
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="e.g. KANTIN, BARAT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 16px",
                border: "1px solid #d0d0d0",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333",
                outline: "none",
                fontFamily: "inherit"
              }}
            />
          </div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>No</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Location</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Zone</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Type</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area, idx) => {
                  const key = `e-checksheet-hydrant-${area.no}`
                  const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
                  let statusLabel = "No Data"
                  let statusColor = "#757575"
                  let lastCheck = "-"

                  if (saved) {
                    try {
                      const data = JSON.parse(saved)
                      if (Array.isArray(data) && data.length > 0) {
                        const latest = data[0].date
                        lastCheck = new Date(latest).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        statusLabel = "Checked"
                        statusColor = "#43a047"
                      }
                    } catch {}
                  }

                  return (
                    <tr key={area.no} style={{ borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{area.no}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{area.lokasi}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>{area.zona}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>{area.jenisHydrant}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <span style={{
                            padding: "4px 12px",
                            background: statusColor,
                            color: "white",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            display: "inline-block"
                          }}>
                            {statusLabel}
                          </span>
                          <span style={{ fontSize: "11px", color: "#9e9e9e" }}>{lastCheck}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => openDetail(area)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: "5px",
                              fontSize: "13px",
                              fontWeight: "500",
                              background: "#1976d2",
                              color: "white",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            View
                          </button>
                          <a
                            href={`/e-checksheet-hydrant?no=${area.no}&lokasi=${encodeURIComponent(area.lokasi)}&zona=${encodeURIComponent(area.zona)}&jenisHydrant=${encodeURIComponent(area.jenisHydrant)}`}
                            style={{
                              padding: "7px 14px",
                              borderRadius: "5px",
                              fontSize: "13px",
                              fontWeight: "500",
                              background: "#43a047",
                              color: "white",
                              textDecoration: "none",
                              display: "inline-block"
                            }}
                          >
                            Inspect
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

        {/* Modal (sama seperti smoke detector) */}
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
                borderRadius: "8px",
                width: "95%",
                maxWidth: "1400px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                background: "#f5f5f5",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", color: "#212121", fontSize: "20px", fontWeight: "600" }}>
                    Inspection History - Unit #{selectedArea.no}
                  </h2>
                  <p style={{ margin: "0", color: "#616161", fontSize: "14px" }}>
                    {selectedArea.lokasi} • {selectedArea.zona} • {selectedArea.jenisHydrant}
                  </p>
                </div>
                <button 
                  onClick={closeDetail} 
                  style={{ 
                    background: "transparent", 
                    border: "none", 
                    fontSize: "28px", 
                    cursor: "pointer", 
                    color: "#757575",
                    padding: "0",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: "16px 24px", background: "white", borderBottom: "1px solid #e0e0e0" }}>
                <label style={{ fontWeight: "500", color: "#424242", marginRight: "12px", fontSize: "14px" }}>
                  Inspection Date:
                </label>
                <select
                  value={selectedDateInModal}
                  onChange={(e) => setSelectedDateInModal(e.target.value)}
                  style={{
                    color: "#212121",
                    padding: "7px 12px",
                    border: "1px solid #d0d0d0",
                    borderRadius: "5px",
                    fontSize: "14px",
                    fontWeight: "500",
                    minWidth: "160px",
                    outline: "none"
                  }}
                >
                  <option value="">Select date</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ padding: "24px", overflowY: "auto", flex: 1, background: "#fafafa" }}>
                {!checksheetData || !Array.isArray(checksheetData) || checksheetData.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#9e9e9e" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📋</div>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>No inspection records found</p>
                  </div>
                ) : !selectedDateInModal ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#757575" }}>
                    <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.5 }}>📅</div>
                    <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>Please select an inspection date</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    {(() => {
                      const entry = checksheetData.find((e: any) => e.date === selectedDateInModal)
                      if (!entry) {
                        return <div style={{ textAlign: "center", padding: "40px", color: "#9e9e9e" }}>No data found for this date</div>
                      }
                      return (
                        <div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1600px", border: "1px solid #e0e0e0", background: "white" }}>
                            <thead>
                              <tr style={{ background: "#f5f5f5" }}>
                                {[...Array(20)].map((_, i) => (
                                  <th key={i} style={{ padding: "8px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", fontSize: "11px" }}>
                                    Item {i + 1}
                                  </th>
                                ))}
                                <th style={{ padding: "8px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", fontSize: "11px" }}>Findings</th>
                                <th style={{ padding: "8px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", fontSize: "11px" }}>Corrective Action</th>
                                <th style={{ padding: "8px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", fontSize: "11px" }}>PIC</th>
                                <th style={{ padding: "8px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", fontSize: "11px" }}>Due Date</th>
                                <th style={{ padding: "8px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", fontSize: "11px" }}>Verify</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {[...Array(20)].map((_, i) => {
                                  const key = `item${i + 1}` as keyof typeof entry
                                  const value = entry[key] || "-"
                                  return (
                                    <td key={i} style={{
                                      padding: "8px",
                                      border: "1px solid #e0e0e0",
                                      textAlign: "center",
                                      fontWeight: "600",
                                      background: value === "OK" ? "#e8f5e9" : value === "NG" ? "#ffebee" : "#fff",
                                      color: value === "OK" ? "#2e7d32" : value === "NG" ? "#c62828" : "#757575",
                                      fontSize: "11px"
                                    }}>
                                      {value}
                                    </td>
                                  )
                                })}
                                <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4", fontSize: "11px" }}>{entry.keteranganKondisi || "-"}</td>
                                <td style={{ padding: "8px", border: "1px solid #e0e0e0", lineHeight: "1.4", fontSize: "11px" }}>{entry.tindakanPerbaikan || "-"}</td>
                                <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>{entry.pic || "-"}</td>
                                <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>
                                  {entry.dueDate ? new Date(entry.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "-"}
                                </td>
                                <td style={{ padding: "8px", border: "1px solid #e0e0e0", textAlign: "center", fontSize: "11px" }}>{entry.verify || "-"}</td>
                              </tr>
                            </tbody>
                          </table>
                          
                          <div style={{ marginTop: "20px", padding: "12px", background: "#f9f9f9", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                            <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "#757575" }}>Inspector</p>
                            <p style={{ margin: "0", fontSize: "13px", fontWeight: "500", color: "#424242" }}>{entry.inspector || "N/A"}</p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 24px", background: "#f5f5f5", borderTop: "1px solid #e0e0e0", textAlign: "right" }}>
                <button 
                  onClick={closeDetail} 
                  style={{ 
                    padding: "9px 20px", 
                    background: "#757575", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "5px", 
                    fontWeight: "500",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}