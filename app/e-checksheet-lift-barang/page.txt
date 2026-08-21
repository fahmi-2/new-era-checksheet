// /app/e-checksheet-lift-barang/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

export default function EChecksheetLiftBarangPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [isMounted, setIsMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({})
  const [today] = useState(new Date())

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const liftName = searchParams.get("liftName") || "Lift Barang"
  const area = searchParams.get("area") || "Area"
  const lokasi = searchParams.get("lokasi") || "Lokasi"

  const inspectionItems = [
    { key: "limitSwitchBawah", no: 1, item: "Limit switch pintu pagar bawah", content: "Limit switch", method: "Dicoba" },
    { key: "pintuKendorPecah1", no: 1, item: "Limit switch pintu pagar bawah", content: "Tidak kendor dan pecah", method: "Visual" },
    { key: "pintuEngsel1", no: 1, item: "Limit switch pintu pagar bawah", content: "Engsel", method: "Dicoba" },
    { key: "pintuPengunci1", no: 1, item: "Limit switch pintu pagar bawah", content: "Pengunci", method: "Dicoba" },
    { key: "limitSwitchAtas", no: 2, item: "Kondisi pintu pagar atas", content: "Limit switch", method: "Dicoba" },
    { key: "pintuKendorPecah2", no: 2, item: "Kondisi pintu pagar atas", content: "Tidak kendor dan pecah", method: "Visual" },
    { key: "pintuEngsel2", no: 2, item: "Kondisi pintu pagar atas", content: "Engsel", method: "Dicoba" },
    { key: "pintuPengunci2", no: 2, item: "Kondisi pintu pagar atas", content: "Pengunci", method: "Dicoba" },
    { key: "limitSwitchPintuLift", no: 3, item: "Kondisi pintu lift", content: "Limit switch", method: "Dicoba" },
    { key: "pintuKendorPecah3", no: 3, item: "Kondisi pintu lift", content: "Tidak kendor dan pecah", method: "Visual" },
    { key: "pintuEngsel3", no: 3, item: "Kondisi pintu lift", content: "Engsel", method: "Dicoba" },
    { key: "pintuPengunci3", no: 3, item: "Kondisi pintu lift", content: "Pengunci", method: "Dicoba" },
    { key: "cabinLift", no: 4, item: "Cabin lift", content: "Rata dengan landasan saat berhenti", method: "Visual" },
    { key: "pushButtonNaik", no: 5, item: "Push button Bawah", content: "Naik", method: "Dicoba" },
    { key: "pushButtonTurun", no: 5, item: "Push button Bawah", content: "Turun", method: "Dicoba" },
    { key: "pushButtonEmergency", no: 5, item: "Push button Bawah", content: "Emergency Stop", method: "Dicoba" },
    { key: "pushButtonAtasNaik", no: 6, item: "Push button Atas", content: "Naik", method: "Dicoba" },
    { key: "pushButtonAtasTurun", no: 6, item: "Push button Atas", content: "Turun", method: "Dicoba" },
    { key: "pushButtonAtasEmergency", no: 6, item: "Push button Atas", content: "Emergency Stop", method: "Dicoba" },
    { key: "sensorLiftTurun", no: 7, item: "Sensor Lift turun", content: "Proximity Switch", method: "Dicoba" },
    { key: "sensorLiftNaik", no: 8, item: "Sensor Lift naik", content: "Proximity Switch", method: "Dicoba" },
    { key: "bearingSliding", no: 9, item: "Kondisi Bearing sliding (All)", content: "Bearing Sliding", method: "Dicoba & di lihat" },
    { key: "kawatSeling", no: 10, item: "Kondisi Kawat seling", content: "Kawat seling", method: "Dilihat" },
    { key: "bunyiAbnormalNaik", no: 11, item: "Bunyi abnormal saat lift naik dan turun", content: "Bearing Sliding", method: "Dicoba" },
    { key: "bunyiAbnormalLiftStopper", no: 12, item: "Bunyi abnormal saat lift berhenti di Stopper atas", content: "Keranjang Lift dengan Stopper atas", method: "Dicoba" },
    { key: "bunyiAbnormalLiftBawah", no: 13, item: "Bunyi abnormal saat lift berhenti di bawah", content: "Keranjang Lift dengan stoper bawah", method: "Di coba" },
  ]

  useEffect(() => {
    if (!isMounted) return

    try {
      const key = `e-checksheet-lift-${liftName}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        setAnswers(parsed)
      }
    } catch (err) {
      console.warn("Failed to parse saved data")
    }
  }, [isMounted, liftName])

  useEffect(() => {
    if (!isMounted || loading) return
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader")) {
      router.push("/login-page")
    }
  }, [user, loading, router, isMounted])

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

  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader")) {
    return null
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

  // Fungsi untuk cek apakah tanggal bisa diedit
  const isDateEditable = (day: number): boolean => {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    // Set waktu ke 00:00:00 untuk perbandingan tanggal saja
    cellDate.setHours(0, 0, 0, 0)
    todayDate.setHours(0, 0, 0, 0)
    
    return cellDate.getTime() === todayDate.getTime()
  }

  // Fungsi untuk menentukan status tanggal (past/today/future)
  const getDateStatus = (day: number): 'past' | 'today' | 'future' => {
    const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    cellDate.setHours(0, 0, 0, 0)
    todayDate.setHours(0, 0, 0, 0)
    
    if (cellDate.getTime() < todayDate.getTime()) return 'past'
    if (cellDate.getTime() === todayDate.getTime()) return 'today'
    return 'future'
  }

  const handleInputChange = (dateKey: string, itemKey: string, value: string, day: number) => {
    // Cek apakah tanggal bisa diedit
    if (!isDateEditable(day)) {
      alert("Anda hanya dapat mengisi data untuk hari ini!")
      return
    }

    setAnswers((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [itemKey]: value,
      },
    }))
  }

  const handleSave = () => {
    if (typeof window !== "undefined") {
      try {
        const key = `e-checksheet-lift-${liftName}`
        localStorage.setItem(key, JSON.stringify(answers))
        alert("Data berhasil disimpan!")
        router.push(`/ga-lift-barang?openLift=${encodeURIComponent(liftName)}`)
      } catch (err) {
        console.error("Gagal menyimpan:", err)
        alert("Gagal menyimpan data.")
      }
    }
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <NavbarStatic userName={user.fullName} />
      <div style={{ padding: "32px 24px", maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            background: "linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)",
            borderRadius: "12px",
            padding: "24px 32px",
            boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)"
          }}>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "28px", fontWeight: "700", letterSpacing: "-0.5px" }}>
              Check Sheet Inspeksi Lift Barang
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "14px", fontWeight: "400" }}>
              Form Pemeriksaan Kelayakan Lift Barang (Monthly Calendar View)
            </p>
          </div>
        </div>

        <div style={{
          background: "white",
          border: "1px solid #e8e8e8",
          borderRadius: "10px",
          padding: "20px 24px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          marginBottom: "28px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
              Nama Lift
            </span>
            <span style={{ color: "#333", fontSize: "14px", fontWeight: "500", textAlign: "right", flex: 1 }}>
              {liftName}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
              Area
            </span>
            <span style={{ color: "#333", fontSize: "14px", fontWeight: "500", textAlign: "right", flex: 1 }}>
              {area}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
              Lokasi
            </span>
            <span style={{ color: "#333", fontSize: "14px", fontWeight: "500", textAlign: "right", flex: 1 }}>
              {lokasi}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
              Bulan Pemeriksaan
            </span>
            <span style={{ color: "#333", fontSize: "14px", fontWeight: "500", textAlign: "right", flex: 1 }}>
              {getMonthYear()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "150px" }}>
              Tanggal Hari Ini
            </span>
            <span style={{ color: "#e65100", fontSize: "14px", fontWeight: "700", textAlign: "right", flex: 1 }}>
              {today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Info Box */}
        <div style={{
          background: "#e3f2fd",
          border: "1px solid #1e88e5",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ fontSize: "20px" }}>ℹ️</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 4px 0", fontWeight: "600", color: "#01579b", fontSize: "13px" }}>
              Perhatian: Real-Time Access
            </p>
            <p style={{ margin: 0, color: "#01579b", fontSize: "12px", lineHeight: "1.5" }}>
              Anda hanya dapat mengisi checksheet untuk <strong>hari ini ({today.getDate()} {getMonthYear()})</strong>. 
              Kolom hari ini berwarna <strong style={{ color: "#2e7d32" }}>putih</strong>, 
              hari sebelumnya dan sesudahnya berwarna <strong style={{ color: "#757575" }}>abu-abu</strong> (tidak dapat diubah).
            </p>
          </div>
        </div>

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
              padding: "10px 20px",
              background: "#1e88e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(30, 136, 229, 0.2)"
            }}
          >
            ← Bulan Lalu
          </button>
          <h3 style={{ margin: 0, color: "#0d47a1", fontSize: "20px", fontWeight: "700" }}>
            {getMonthYear()}
          </h3>
          <button
            onClick={() => changeMonth(1)}
            style={{
              padding: "10px 20px",
              background: "#1e88e5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(30, 136, 229, 0.2)"
            }}
          >
            Bulan Depan →
          </button>
        </div>

        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
          border: "2px solid #0d47a1",
          marginBottom: "28px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              minWidth: "1200px"
            }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{
                    background: "#e3f2fd",
                    fontWeight: "600",
                    color: "#01579b",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "14px 10px",
                    textAlign: "center",
                    border: "1px solid #0d47a1",
                    minWidth: "50px"
                  }}>
                    NO
                  </th>
                  <th rowSpan={2} style={{
                    background: "#e3f2fd",
                    fontWeight: "600",
                    color: "#01579b",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "14px 10px",
                    textAlign: "center",
                    border: "1px solid #0d47a1",
                    minWidth: "200px"
                  }}>
                    ITEM
                  </th>
                  <th rowSpan={2} style={{
                    background: "#e3f2fd",
                    fontWeight: "600",
                    color: "#01579b",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "14px 10px",
                    textAlign: "center",
                    border: "1px solid #0d47a1",
                    minWidth: "160px"
                  }}>
                    CONTENT
                  </th>
                  <th rowSpan={2} style={{
                    background: "#e3f2fd",
                    fontWeight: "600",
                    color: "#01579b",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "14px 10px",
                    textAlign: "center",
                    border: "1px solid #0d47a1",
                    minWidth: "90px"
                  }}>
                    METHODE
                  </th>
                  <th colSpan={days.length} style={{
                    background: "#e3f2fd",
                    fontWeight: "600",
                    color: "#01579b",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "14px 10px",
                    textAlign: "center",
                    border: "1px solid #0d47a1"
                  }}>
                    Bulan: {getMonthYear()}
                  </th>
                </tr>
                <tr>
                  {days.map((day) => {
                    const dateStatus = getDateStatus(day)
                    const isToday = dateStatus === 'today'
                    
                    return (
                      <th key={day} style={{
                        background: isToday ? "#fff9c4" : "#e3f2fd",
                        fontWeight: isToday ? "700" : "600",
                        color: isToday ? "#e65100" : "#01579b",
                        fontSize: "11px",
                        padding: "12px 6px",
                        textAlign: "center",
                        border: isToday ? "2px solid #ff6f00" : "1px solid #0d47a1",
                        minWidth: "50px"
                      }}>
                        {day}
                        {isToday && <div style={{ fontSize: "9px", marginTop: "2px" }}>HARI INI</div>}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {inspectionItems.map((item, idx) => (
                  <tr key={item.key}>
                    <td style={{
                      padding: "10px",
                      borderBottom: "1px solid #0d47a1",
                      borderRight: "1px solid #0d47a1",
                      borderLeft: "1px solid #0d47a1",
                      fontWeight: "600",
                      color: "#333",
                      textAlign: "center",
                      background: "white",
                      fontSize: "11px"
                    }}>
                      {item.no}
                    </td>
                    <td style={{
                      padding: "10px",
                      borderBottom: "1px solid #0d47a1",
                      borderRight: "1px solid #0d47a1",
                      fontWeight: "500",
                      color: "#333",
                      background: "white",
                      fontSize: "11px"
                    }}>
                      {item.item}
                    </td>
                    <td style={{
                      padding: "10px",
                      borderBottom: "1px solid #0d47a1",
                      borderRight: "1px solid #0d47a1",
                      fontWeight: "400",
                      color: "#555",
                      background: "white",
                      fontSize: "11px"
                    }}>
                      {item.content}
                    </td>
                    <td style={{
                      padding: "10px",
                      borderBottom: "1px solid #0d47a1",
                      borderRight: "1px solid #0d47a1",
                      textAlign: "center",
                      fontWeight: "400",
                      color: "#555",
                      background: "white",
                      fontSize: "11px"
                    }}>
                      {item.method}
                    </td>
                    {days.map((day) => {
                      const dateKey = formatDateKey(day)
                      const value = answers[dateKey]?.[item.key] || ""
                      const dateStatus = getDateStatus(day)
                      const isEditable = dateStatus === 'today'
                      
                      // Tentukan background color
                      let cellBgColor = "#e0e0e0" // Default abu-abu untuk past/future
                      if (isEditable) {
                        // Hari ini - putih atau sesuai status
                        cellBgColor = value === "✓" ? "#c8e6c9" : value === "✗" ? "#ffcdd2" : "white"
                      }

                      return (
                        <td key={day} style={{
                          padding: "4px",
                          borderBottom: "1px solid #0d47a1",
                          borderRight: "1px solid #0d47a1",
                          textAlign: "center",
                          verticalAlign: "middle",
                          background: cellBgColor
                        }}>
                          {isEditable ? (
                            <select
                              value={value}
                              onChange={(e) => handleInputChange(dateKey, item.key, e.target.value, day)}
                              style={{
                                width: "100%",
                                padding: "6px 4px",
                                border: "1px solid #1e88e5",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: value === "✓" ? "#2e7d32" : value === "✗" ? "#c62828" : "#333",
                                background: value === "✓" ? "#c8e6c9" : value === "✗" ? "#ffcdd2" : "white",
                                cursor: "pointer",
                                transition: "all 0.3s ease"
                              }}
                            >
                              <option value="">-</option>
                              <option value="✓">✓</option>
                              <option value="✗">✗</option>
                            </select>
                          ) : (
                            <div style={{
                              padding: "6px 4px",
                              fontSize: "13px",
                              fontWeight: "700",
                              color: value ? (value === "✓" ? "#2e7d32" : "#c62828") : "#000000",
                              cursor: "not-allowed",
                              opacity: 0.7
                            }}>
                              {value || "-"}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr style={{ background: "#e3f2fd" }}>
                  <td colSpan={4} style={{
                    padding: "12px",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#01579b",
                    background: "#e3f2fd",
                    border: "1px solid #0d47a1",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    NAMA (INISIAL) / NIK
                  </td>
                  {days.map((day) => {
                    const dateKey = formatDateKey(day)
                    const inspector = answers[dateKey]?.inspector || ""
                    const dateStatus = getDateStatus(day)
                    const isEditable = dateStatus === 'today'
                    
                    const cellBgColor = isEditable ? "white" : "#e0e0e0"

                    return (
                      <td key={day} style={{
                        padding: "4px",
                        border: "1px solid #0d47a1",
                        textAlign: "center",
                        background: cellBgColor
                      }}>
                        {isEditable ? (
                          <input
                            type="text"
                            value={inspector}
                            onChange={(e) => handleInputChange(dateKey, "inspector", e.target.value, day)}
                            placeholder="NIK"
                            style={{
                              width: "100%",
                              padding: "6px 4px",
                              border: "1px solid #1e88e5",
                              borderRadius: "4px",
                              fontSize: "11px",
                              color: "#333",
                              textAlign: "center",
                              transition: "all 0.3s ease"
                            }}
                          />
                        ) : (
                          <div style={{
                            padding: "6px 4px",
                            fontSize: "11px",
                            color: inspector ? "#333" : "#333",
                            cursor: "not-allowed",
                            opacity: 0.7
                          }}>
                            {inspector || "-"}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          padding: "20px 0",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => router.push("/ga-lift-barang")}
            style={{
              padding: "10px 28px",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              minWidth: "140px",
              background: "#bdbdbd",
              color: "white",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
            }}
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 28px",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              minWidth: "140px",
              background: "linear-gradient(135deg, #1e88e5, #0d47a1)",
              color: "white",
              boxShadow: "0 2px 8px rgba(13, 71, 161, 0.2)"
            }}
          >
            ✓ Simpan
          </button>
        </div>
      </div>
    </div>
  )
}