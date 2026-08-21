// /app/ga-lift-barang/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

interface LiftItem {
  no: number
  namaLift: string
  area: string
  lokasi: string
}

interface ChecksheetData {
  [date: string]: {
    limitSwitchBawah: string
    limitSwitchAtas: string
    pintuKendorPecah: string
    pintuEngsel: string
    pintuPengunci: string
    limitSwitchPintuLift: string
    cabinLift: string
    pushButtonNaik: string
    pushButtonTurun: string
    pushButtonEmergency: string
    pushButtonAtasNaik: string
    pushButtonAtasTurun: string
    pushButtonAtasEmergency: string
    sensorLiftTurun: string
    sensorLiftNaik: string
    bearingSliding: string
    kawatSeling: string
    bunyiAbnormalNaik: string
    bunyiAbnormalLiftStopper: string
    bunyiAbnormalLiftBawah: string
    inspector: string
  }
}

export default function GaLiftBarangPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)

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
    const openLift = searchParams.get("openLift")
    if (!openLift) return
    const found = lifts.find((l) => l.namaLift === openLift)
    if (found) {
      setTimeout(() => openDetail(found), 50)
    }
  }, [isMounted, loading, searchParams])

  const lifts: LiftItem[] = [
    { no: 1, namaLift: "Lift Barang Produksi", area: "Genba A Lt. 2", lokasi: "Produksi Genba A" },
    { no: 2, namaLift: "Lift Barang Genba B", area: "Genba B Lt. 2", lokasi: "Produksi Genba B" },
    { no: 3, namaLift: "Lift Barang Genba C", area: "Genba C Lt. 2", lokasi: "Produksi Genba C" },
    { no: 4, namaLift: "Lift Barang Genba D", area: "Genba D Lt. 2", lokasi: "Produksi Genba D" },
    { no: 5, namaLift: "Lift Barang Genba E", area: "Genba E Lt. 2", lokasi: "Produksi Genba E" },
    { no: 6, namaLift: "Lift Barang Warehouse", area: "Warehouse Lt. 2", lokasi: "Area Warehouse" },
  ]

  const [selectedLift, setSelectedLift] = useState<LiftItem | null>(null)
  const [checksheetData, setChecksheetData] = useState<ChecksheetData | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const openDetail = (lift: LiftItem) => {
    setSelectedLift(lift)
    const key = `e-checksheet-lift-${lift.namaLift}`
    const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setChecksheetData(data)
      } catch (e) {
        setChecksheetData(null)
      }
    } else {
      setChecksheetData(null)
    }
    setShowModal(true)
  }

  const closeDetail = () => {
    setSelectedLift(null)
    setChecksheetData(null)
    setShowModal(false)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: days }, (_, i) => i + 1)
  }

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    return `${year}-${month}-${d}`
  }

  const getMonthYear = () => {
    return currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  }

  const changeMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1))
  }

  const inspectionItems = [
    { no: 1, item: "Limit switch pintu pagar bawah", content: "Limit switch", method: "Dicoba" },
    { no: 1, item: "Limit switch pintu pagar bawah", content: "Tidak kendor dan pecah", method: "Visual" },
    { no: 1, item: "Limit switch pintu pagar bawah", content: "Engsel", method: "Dicoba" },
    { no: 1, item: "Limit switch pintu pagar bawah", content: "Pengunci", method: "Dicoba" },
    { no: 2, item: "Kondisi pintu pagar atas", content: "Limit switch", method: "Dicoba" },
    { no: 2, item: "Kondisi pintu pagar atas", content: "Tidak kendor dan pecah", method: "Visual" },
    { no: 2, item: "Kondisi pintu pagar atas", content: "Engsel", method: "Dicoba" },
    { no: 2, item: "Kondisi pintu pagar atas", content: "Pengunci", method: "Dicoba" },
    { no: 3, item: "Kondisi pintu lift", content: "Limit switch", method: "Dicoba" },
    { no: 3, item: "Kondisi pintu lift", content: "Tidak kendor dan pecah", method: "Visual" },
    { no: 3, item: "Kondisi pintu lift", content: "Engsel", method: "Dicoba" },
    { no: 3, item: "Kondisi pintu lift", content: "Pengunci", method: "Dicoba" },
    { no: 4, item: "Cabin lift", content: "Rata dengan landasan saat berhenti", method: "Visual" },
    { no: 5, item: "Push button Bawah", content: "Naik", method: "Dicoba" },
    { no: 5, item: "Push button Bawah", content: "Turun", method: "Dicoba" },
    { no: 5, item: "Push button Bawah", content: "Emergency Stop", method: "Dicoba" },
    { no: 6, item: "Push button Atas", content: "Naik", method: "Dicoba" },
    { no: 6, item: "Push button Atas", content: "Turun", method: "Dicoba" },
    { no: 6, item: "Push button Atas", content: "Emergency Stop", method: "Dicoba" },
    { no: 7, item: "Sensor Lift turun", content: "Proximity Switch", method: "Dicoba" },
    { no: 8, item: "Sensor Lift naik", content: "Proximity Switch", method: "Dicoba" },
    { no: 9, item: "Kondisi Bearing sliding (All)", content: "Bearing Sliding", method: "Dicoba & di lihat" },
    { no: 10, item: "Kondisi Kawat seling", content: "Kawat seling", method: "Dilihat" },
    { no: 11, item: "Bunyi abnormal saat lift naik dan turun", content: "Bearing Sliding", method: "Dicoba" },
    { no: 12, item: "Bunyi abnormal saat lift berhenti di Stopper atas", content: "Keranjang Lift dengan Stopper atas", method: "Dicoba" },
    { no: 13, item: "Bunyi abnormal saat lift berhenti di bawah", content: "Keranjang Lift dengan stoper bawah", method: "Di coba" },
  ]

  const fieldKeys = [
    "limitSwitchBawah", "pintuKendorPecah1", "pintuEngsel1", "pintuPengunci1",
    "limitSwitchAtas", "pintuKendorPecah2", "pintuEngsel2", "pintuPengunci2",
    "limitSwitchPintuLift", "pintuKendorPecah3", "pintuEngsel3", "pintuPengunci3",
    "cabinLift",
    "pushButtonNaik", "pushButtonTurun", "pushButtonEmergency",
    "pushButtonAtasNaik", "pushButtonAtasTurun", "pushButtonAtasEmergency",
    "sensorLiftTurun", "sensorLiftNaik", "bearingSliding", "kawatSeling",
    "bunyiAbnormalNaik", "bunyiAbnormalLiftStopper", "bunyiAbnormalLiftBawah"
  ]

  if (!isMounted) {
    return null
  }

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
      <div style={{ padding: "32px 24px", maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            background: "linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)",
            borderRadius: "12px",
            padding: "24px 32px",
            boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)"
          }}>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "28px", fontWeight: "700", letterSpacing: "-0.5px" }}>
              GA Lift Barang Inspection
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "14px", fontWeight: "400" }}>
              Manajemen Data Inspeksi Kelayakan Lift Barang
            </p>
          </div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
          border: "1px solid #e8e8e8"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "800px" }}>
              <thead>
                <tr>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    width: "50px"
                  }}>No</th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    minWidth: "200px"
                  }}>Nama Lift Barang</th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    minWidth: "150px"
                  }}>Area</th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    minWidth: "180px"
                  }}>Lokasi</th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    background: "#f5f7fa",
                    fontWeight: "600",
                    color: "#0d47a1",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "2px solid #e8e8e8",
                    minWidth: "220px"
                  }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {lifts.map((lift) => (
                  <tr key={lift.no} style={{ transition: "background-color 0.2s ease" }}>
                    <td style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f0f0f0",
                      textAlign: "center",
                      fontWeight: "600",
                      color: "#333"
                    }}>{lift.no}</td>
                    <td style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f0f0f0",
                      fontWeight: "500",
                      color: "#1e88e5"
                    }}>{lift.namaLift}</td>
                    <td style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f0f0f0",
                      color: "#666",
                      fontSize: "13px"
                    }}>{lift.area}</td>
                    <td style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid #f0f0f0",
                      color: "#666",
                      fontSize: "13px"
                    }}>{lift.lokasi}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                        <button
                          onClick={() => openDetail(lift)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            background: "#1e88e5",
                            color: "white"
                          }}
                        >
                          DETAIL
                        </button>
                        <a
                          href={`/e-checksheet-lift-barang?liftName=${encodeURIComponent(lift.namaLift)}&area=${encodeURIComponent(lift.area)}&lokasi=${encodeURIComponent(lift.lokasi)}`}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isMounted && showModal && selectedLift && (
          <div
            onClick={closeDetail}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
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
                width: "98%",
                maxWidth: "1400px",
                maxHeight: "90vh",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "24px 28px",
                background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
                borderBottom: "2px solid #e8e8e8",
                flexShrink: 0,
                flexWrap: "wrap",
                gap: "12px"
              }}>
                <div>
                  <h2 style={{ margin: "0 0 4px 0", color: "#0d47a1", fontSize: "20px", fontWeight: "700" }}>
                    Detail Lift Barang
                  </h2>
                  <p style={{ margin: "4px 0", color: "#1e88e5", fontSize: "14px", fontWeight: "500" }}>
                    {selectedLift.namaLift}
                  </p>
                  <p style={{ margin: "0", color: "#777", fontSize: "12px" }}>
                    {selectedLift.area} - {selectedLift.lokasi}
                  </p>
                </div>
                <button
                  onClick={closeDetail}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "28px",
                    cursor: "pointer",
                    color: "#999",
                    padding: 0,
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    flexShrink: 0
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: "20px 28px", overflowY: "auto", flex: 1 }}>
                {!checksheetData || Object.keys(checksheetData).length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", fontSize: "14px" }}>
                    <p>Belum ada data pengecekan</p>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                      gap: "16px",
                      flexWrap: "wrap"
                    }}>
                      <button
                        onClick={() => changeMonth(-1)}
                        style={{
                          padding: "8px 16px",
                          background: "#1e88e5",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600"
                        }}
                      >
                        ← Bulan Lalu
                      </button>
                      <h3 style={{ margin: 0, color: "#0d47a1", fontSize: "18px", fontWeight: "600" }}>
                        {getMonthYear()}
                      </h3>
                      <button
                        onClick={() => changeMonth(1)}
                        style={{
                          padding: "8px 16px",
                          background: "#1e88e5",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600"
                        }}
                      >
                        Bulan Depan →
                      </button>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "11px",
                        minWidth: "1200px",
                        border: "2px solid #0d47a1"
                      }}>
                        <thead>
                          <tr>
                            <th rowSpan={2} style={{
                              padding: "10px 8px",
                              background: "#e3f2fd",
                              fontWeight: "600",
                              color: "#01579b",
                              fontSize: "10px",
                              textAlign: "center",
                              border: "1px solid #0d47a1",
                              minWidth: "40px"
                            }}>
                              No
                            </th>
                            <th rowSpan={2} style={{
                              padding: "10px 8px",
                              background: "#e3f2fd",
                              fontWeight: "600",
                              color: "#01579b",
                              fontSize: "10px",
                              textAlign: "center",
                              border: "1px solid #0d47a1",
                              minWidth: "180px"
                            }}>
                              ITEM
                            </th>
                            <th rowSpan={2} style={{
                              padding: "10px 8px",
                              background: "#e3f2fd",
                              fontWeight: "600",
                              color: "#01579b",
                              fontSize: "10px",
                              textAlign: "center",
                              border: "1px solid #0d47a1",
                              minWidth: "150px"
                            }}>
                              CONTENT
                            </th>
                            <th rowSpan={2} style={{
                              padding: "10px 8px",
                              background: "#e3f2fd",
                              fontWeight: "600",
                              color: "#01579b",
                              fontSize: "10px",
                              textAlign: "center",
                              border: "1px solid #0d47a1",
                              minWidth: "80px"
                            }}>
                              METHODE
                            </th>
                            <th colSpan={getDaysInMonth(currentMonth).length} style={{
                              padding: "10px 8px",
                              background: "#e3f2fd",
                              fontWeight: "600",
                              color: "#01579b",
                              fontSize: "10px",
                              textAlign: "center",
                              border: "1px solid #0d47a1"
                            }}>
                              Bulan: {getMonthYear()}
                            </th>
                          </tr>
                          <tr>
                            {getDaysInMonth(currentMonth).map((day) => (
                              <th key={day} style={{
                                padding: "8px 4px",
                                background: "#e3f2fd",
                                fontWeight: "600",
                                color: "#01579b",
                                fontSize: "10px",
                                textAlign: "center",
                                border: "1px solid #0d47a1",
                                minWidth: "35px"
                              }}>
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {inspectionItems.map((row, idx) => {
                            const fieldKey = fieldKeys[idx]
                            
                            return (
                              <tr key={idx}>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontWeight: "500",
                                  color: "#333",
                                  fontSize: "10px",
                                  background: "white"
                                }}>
                                  {row.no}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  fontWeight: "500",
                                  color: "#333",
                                  fontSize: "10px",
                                  background: "white"
                                }}>
                                  {row.item}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  fontWeight: "400",
                                  color: "#555",
                                  fontSize: "10px",
                                  background: "white"
                                }}>
                                  {row.content}
                                </td>
                                <td style={{
                                  padding: "8px 6px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontWeight: "400",
                                  color: "#555",
                                  fontSize: "10px",
                                  background: "white"
                                }}>
                                  {row.method}
                                </td>
                                {getDaysInMonth(currentMonth).map((day) => {
                                  const dateKey = formatDateKey(day)
                                  const value = (checksheetData[dateKey]?.[fieldKey as keyof ChecksheetData[string]]) || "-"
                                  const bgColor = value === "✓" ? "#c8e6c9" : value === "✗" ? "#ffcdd2" : "#fff"
                                  
                                  return (
                                    <td key={day} style={{
                                      padding: "6px 4px",
                                      border: "1px solid #0d47a1",
                                      textAlign: "center",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      background: bgColor,
                                      color: value === "✓" ? "#2e7d32" : value === "✗" ? "#c62828" : "#999"
                                    }}>
                                      {value}
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                          <tr style={{ background: "#f5f9ff" }}>
                            <td colSpan={4} style={{
                              padding: "10px 8px",
                              border: "1px solid #0d47a1",
                              textAlign: "right",
                              fontWeight: "600",
                              color: "#01579b",
                              fontSize: "10px",
                              background: "#e3f2fd"
                            }}>
                              NAMA(INISIAL)/NIK
                            </td>
                            {getDaysInMonth(currentMonth).map((day) => {
                              const dateKey = formatDateKey(day)
                              const inspector = checksheetData[dateKey]?.inspector || "-"
                              
                              return (
                                <td key={day} style={{
                                  padding: "6px 4px",
                                  border: "1px solid #0d47a1",
                                  textAlign: "center",
                                  fontSize: "10px",
                                  fontWeight: "500",
                                  color: "#333"
                                }}>
                                  {inspector}
                                </td>
                              )
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "20px 28px",
                background: "#f5f7fa",
                borderTop: "1px solid #e8e8e8",
                flexShrink: 0
              }}>
                <button
                  onClick={closeDetail}
                  style={{
                    padding: "8px 20px",
                    background: "#bdbdbd",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                >
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