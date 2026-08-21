// /app/ga-inspeksi-apd/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

interface ApdArea {
  id: number
  name: string
  type: string // "Produksi" / "QA" / "Warehouse" / dll
}

const APD_AREAS: ApdArea[] = [
  { id: 1, name: "PRE ASSY AREA GENBA C", type: "Produksi" },
  { id: 2, name: "PRE ASSY GENBA A+B", type: "Produksi" },
  { id: 3, name: "AREA FINAL ASSY", type: "Produksi" },
  { id: 4, name: "AREA CUTTING TUBE", type: "Produksi" },
  { id: 5, name: "INSPEKSI PRE ASSY AREA GENBA C", type: "QA" },
  { id: 6, name: "INSPEKSI PRE ASSY GENBA A+B", type: "QA" },
  { id: 7, name: "AREA INSPEKSI FINAL ASSY", type: "QA" },
  { id: 8, name: "AREA WAREHOUSE", type: "Gudang" },
  { id: 9, name: "AREA EXIM", type: "Logistik" },
  { id: 10, name: "AREA PREV. APPLICATOR", type: "Produksi" },
  { id: 11, name: "AREA WORKSHOP", type: "Maintenance" },
  { id: 12, name: "AREA UTILITY", type: "Utilitas" },
  { id: 13, name: "AREA RECEIVING INSPECTION MATERIAL", type: "QA" },
  { id: 14, name: "AREA VOLTAGE TEST", type: "QA" },
]

export default function GaInspeksiApdPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [isMounted, setIsMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("Produksi")
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

  const filteredData = APD_AREAS.filter(item =>
    item.type === selectedCategory &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const [selectedArea, setSelectedArea] = useState<ApdArea | null>(null)
  const [checksheetData, setChecksheetData] = useState<any[]>([])
  const [selectedDateInModal, setSelectedDateInModal] = useState<string>("")
  const [availableDates, setAvailableDates] = useState<string[]>([])

  const openDetail = (area: ApdArea) => {
    setSelectedArea(area)
    const key = `e-checksheet-apd-${area.id}`
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
        setChecksheetData([])
        setAvailableDates([])
        setSelectedDateInModal("")
      }
    } else {
      setChecksheetData([])
      setAvailableDates([])
      setSelectedDateInModal("")
    }
    setShowModal(true)
  }

  const closeDetail = () => {
    setSelectedArea(null)
    setChecksheetData([])
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
              🛡️ APD Inspection Dashboard
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px", fontWeight: "400" }}>
              Monthly inspection schedule and maintenance records for Personal Protective Equipment
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
              Area Type:
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
              <option value="Produksi">Produksi</option>
              <option value="QA">QA</option>
              <option value="Gudang">Gudang</option>
              <option value="Logistik">Logistik</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Utilitas">Utilitas</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <label htmlFor="search-input" style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
              Search Area:
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="e.g. GENBA, FINAL, WAREHOUSE..."
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
                  <th style={{ padding: "14px 16px", textAlign: "left", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Area Name</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Type</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "center", background: "#fafafa", fontWeight: "600", color: "#424242", fontSize: "13px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area, idx) => {
                  const key = `e-checksheet-apd-${area.id}`
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
                    <tr key={area.id} style={{ borderBottom: idx === filteredData.length - 1 ? "none" : "1px solid #f0f0f0" }}>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#1976d2" }}>{idx + 1}</td>
                      <td style={{ padding: "14px 16px", fontWeight: "500", color: "#424242" }}>{area.name}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "600", color: "#616161" }}>{area.type}</td>
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
                            href={`/e-checksheet-ins-apd?areaId=${area.id}&areaName=${encodeURIComponent(area.name)}&areaType=${encodeURIComponent(area.type)}`}
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

        {/* Modal */}
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
                    Inspection History - {selectedArea.name}
                  </h2>
                  <p style={{ margin: "0", color: "#616161", fontSize: "14px" }}>
                    {selectedArea.type}
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

                      if (!Array.isArray(entry.data) || entry.data.length === 0) {
                        return <div style={{ textAlign: "center", padding: "40px", color: "#9e9e9e" }}>No inspection items recorded</div>
                      }

                      return (
                        <div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1600px", border: "1px solid #e0e0e0", background: "white" }}>
                            <thead>
                              <tr style={{ background: "#fafafa", borderBottom: "2px solid #ccc" }}>
                                <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "4%" }}>NO</th>
                                <th style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "12%" }}>PROSES</th>
                                <th rowSpan={2} colSpan={6} style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "30%" }}>NO. MESIN/NIK</th>
                                <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "8%" }}>PROSENTASE OK</th>
                                <th rowSpan={2} colSpan={4} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "16%" }}>PROBLEM</th>
                                <th rowSpan={2} colSpan={4} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "16%" }}>TINDAKAN PERBAIKAN</th>
                                <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "8%" }}>PIC</th>
                                <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "8%" }}>VERIFY</th>
                              </tr>
                              <tr style={{ background: "#fafafa", borderBottom: "2px solid #ccc" }}>
                                <th style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "18%" }}>STANDART APD</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.data.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td style={{ 
                                    padding: "8px", 
                                    border: "1px solid #ddd", 
                                    textAlign: "center", 
                                    fontWeight: "600",
                                    background: row.type === "proses" ? "#f5f5f5" : "white"
                                  }}>
                                    {idx + 1}
                                  </td>
                                  <td style={{ 
                                    padding: "8px", 
                                    border: "1px solid #ddd", 
                                    textAlign: "left", 
                                    fontWeight: row.type === "proses" ? "600" : "normal",
                                    background: row.type === "proses" ? "#f5f5f5" : "white"
                                  }}>
                                    {row.proses || "-"}
                                  </td>
                                  {[...Array(6)].map((_, i) => {
                                    const val = row[`r${i + 1}`] || "";
                                    return (
                                      <td key={i} style={{ 
                                        padding: "6px", 
                                        border: "1px solid #ddd", 
                                        textAlign: "center",
                                        background: "white"
                                      }}>
                                        {val}
                                      </td>
                                    );
                                  })}
                                  <td style={{ 
                                    padding: "8px", 
                                    border: "1px solid #ddd", 
                                    textAlign: "center",
                                    background: "white"
                                  }}>
                                    {row.persentaseOk || ""}
                                  </td>
                                  <td colSpan={4} style={{ 
                                    padding: "6px", 
                                    border: "1px solid #ddd",
                                    background: "white"
                                  }}>
                                    {row.problem || "-"}
                                  </td>
                                  <td colSpan={4} style={{ 
                                    padding: "6px", 
                                    border: "1px solid #ddd",
                                    background: "white"
                                  }}>
                                    {row.tindakanPerbaikan || "-"}
                                  </td>
                                  <td style={{ 
                                    padding: "6px", 
                                    border: "1px solid #ddd",
                                    background: "white"
                                  }}>
                                    {row.pic || "-"}
                                  </td>
                                  <td style={{ 
                                    padding: "6px", 
                                    border: "1px solid #ddd",
                                    background: "white"
                                  }}>
                                    {row.verify || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          <div style={{ marginTop: "20px", padding: "16px", background: "#f9f9f9", borderRadius: "6px", border: "1px solid #e0e0e0" }}>
                            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#757575" }}>Inspector</p>
                            <p style={{ margin: "0", fontSize: "14px", fontWeight: "500", color: "#424242" }}>{entry.inspector || "N/A"}</p>
                            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#757575" }}>Inspection Date</p>
                            <p style={{ margin: "0", fontSize: "14px", fontWeight: "500", color: "#424242" }}>
                              {new Date(entry.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                            </p>
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