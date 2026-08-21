// /app/e-checksheet-smoke-detector/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

interface ChecksheetEntry {
  date: string
  alarmBell: string
  indicatorLamp: string
  kebersihan: string
  keteranganKondisi: string
  tindakanPerbaikan: string
  pic: string
  dueDate: string
  verify: string
  inspector: string
}

export default function EChecksheetSmokeDetectorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  const [isMounted, setIsMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [alarmBell, setAlarmBell] = useState<string>("")
  const [indicatorLamp, setIndicatorLamp] = useState<string>("")
  const [kebersihan, setKebersihan] = useState<string>("")
  const [keteranganKondisi, setKeteranganKondisi] = useState<string>("")
  const [tindakanPerbaikan, setTindakanPerbaikan] = useState<string>("")
  const [pic, setPic] = useState<string>("")
  const [dueDate, setDueDate] = useState<string>("")
  const [verify, setVerify] = useState<string>("")
  const [savedData, setSavedData] = useState<ChecksheetEntry[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const no = searchParams?.get("no") || "0"
  const lokasi = searchParams?.get("lokasi") || "Smoke Detector Location"
  const zona = searchParams?.get("zona") || "Zone"

  useEffect(() => {
    if (!isMounted) return
    try {
      const key = `e-checksheet-smoke-detector-${no}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSavedData(parsed)
      }
    } catch (err) {
      console.warn("Failed to parse saved data")
    }
  }, [isMounted, no])

  useEffect(() => {
    if (!isMounted || loading) return
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader")) {
      router.push("/login-page")
    }
  }, [user, loading, router, isMounted])

  if (!isMounted) return null

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

  const handleSave = () => {
    if (!selectedDate) {
      alert("Please select an inspection date")
      return
    }

    if (!alarmBell || !indicatorLamp || !kebersihan) {
      alert("Please complete all inspection fields (Alarm Bell, Indicator Lamp, Cleanliness)")
      return
    }

    try {
      const entry: ChecksheetEntry = {
        date: selectedDate,
        alarmBell,
        indicatorLamp,
        kebersihan,
        keteranganKondisi,
        tindakanPerbaikan,
        pic,
        dueDate,
        verify,
        inspector: user.fullName || ""
      }

      const newData = [...savedData]
      const existingIndex = newData.findIndex(e => e.date === selectedDate)
      
      if (existingIndex >= 0) {
        newData[existingIndex] = entry
      } else {
        newData.unshift(entry)
      }

      newData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const key = `e-checksheet-smoke-detector-${no}`
      localStorage.setItem(key, JSON.stringify(newData))
      alert(`Inspection data saved for ${new Date(selectedDate).toLocaleDateString("en-US")}`)
      router.push(`/ga-smoke-detector?openArea=${encodeURIComponent(lokasi)}`)
    } catch (err) {
      console.error("Save failed:", err)
      alert("Failed to save data")
    }
  }

  const handleLoadExisting = () => {
    if (!selectedDate) {
      alert("Please select a date first")
      return
    }

    const entry = savedData.find(e => e.date === selectedDate)
    
    if (entry) {
      setAlarmBell(entry.alarmBell)
      setIndicatorLamp(entry.indicatorLamp)
      setKebersihan(entry.kebersihan)
      setKeteranganKondisi(entry.keteranganKondisi)
      setTindakanPerbaikan(entry.tindakanPerbaikan)
      setPic(entry.pic)
      setDueDate(entry.dueDate)
      setVerify(entry.verify)
      alert("Data loaded successfully")
    } else {
      alert("No data found for this date")
      setAlarmBell("")
      setIndicatorLamp("")
      setKebersihan("")
      setKeteranganKondisi("")
      setTindakanPerbaikan("")
      setPic("")
      setDueDate("")
      setVerify("")
    }
  }

  const generateBiMonthlyDates = () => {
    const today = new Date()
    const year = today.getFullYear()
    const currentMonth = today.getMonth()

    const biMonthlyMonths = [0, 2, 4, 6, 8, 10]

    let nextInspectionMonth = biMonthlyMonths.find(m => m >= currentMonth)
    if (nextInspectionMonth === undefined) {
      nextInspectionMonth = 0
      return [new Date(year + 1, 0, 1).toISOString().split('T')[0]]
    }

    const dates = [
      new Date(year, nextInspectionMonth, 1),
      ...(nextInspectionMonth + 2 <= 11 ? [new Date(year, nextInspectionMonth + 2, 1)] : [])
    ].map(d => d.toISOString().split('T')[0])

    return dates
  }

  const inspectionSchedule = generateBiMonthlyDates()

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <NavbarStatic userName={user.fullName} />
      <div style={{ padding: "24px 20px", maxWidth: "100%", margin: "0 auto" }}>
        
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "24px 28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              Smoke Detector Inspection Form
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px" }}>
              Bi-monthly inspection checklist
            </p>
          </div>
        </div>

        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Unit Number</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{no}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Location</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{lokasi}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Zone</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{zona}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Inspector</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{user.fullName}</span>
            </div>
          </div>
        </div>

        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "24px"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontWeight: "500", color: "#212121", fontSize: "15px" }}>Inspection Schedule</span>
            <span style={{ fontSize: "13px", color: "#757575", marginLeft: "8px" }}>• Every 2 months (Jan, Mar, May, Jul, Sep, Nov)</span>
          </div>
          {/* <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            {inspectionSchedule.map(date => (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                style={{
                  padding: "8px 16px",
                  background: selectedDate === date ? "#1976d2" : "white",
                  color: selectedDate === date ? "white" : "#424242",
                  border: "1px solid #d0d0d0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                {new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </button>
            ))}
          </div> */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>Pilih Tanggal:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                color: "#212121",
                padding: "7px 12px",
                border: "1px solid #d0d0d0",
                borderRadius: "5px",
                fontSize: "14px",
                outline: "none"
              }}
            />
            <button
              onClick={handleLoadExisting}
              disabled={!selectedDate}
              style={{
                padding: "7px 16px",
                background: selectedDate ? "#ff9800" : "#e0e0e0",
                color: selectedDate ? "white" : "#9e9e9e",
                border: "none",
                borderRadius: "5px",
                cursor: selectedDate ? "pointer" : "not-allowed",
                fontWeight: "500",
                fontSize: "14px"
              }}
            >
              Load Existing
            </button>
          </div>
        </div>

        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          marginBottom: "24px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "1200px" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "2px solid #e0e0e0" }}>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "11%" }}>Alarm Bell</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "11%" }}>Indicator Lamp</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "11%" }}>Cleanliness</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "18%" }}>Findings (if NG)</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "left", width: "18%" }}>Corrective Action</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>PIC</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "11%" }}>Due Date</th>
                  <th style={{ padding: "14px 12px", border: "1px solid #e0e0e0", fontWeight: "600", color: "#424242", textAlign: "center", width: "10%" }}>Verify</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center" }}>
                    <select
                      value={alarmBell}
                      onChange={(e) => setAlarmBell(e.target.value)}
                      disabled={!selectedDate}
                      style={{ 
                        width: "100%", 
                        padding: "8px", 
                        border: "1px solid #d0d0d0", 
                        borderRadius: "5px",
                        fontWeight: "500",
                        fontSize: "14px",
                        outline: "none",
                        background: "white"
                      }}
                    >
                      <option value="">-</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center" }}>
                    <select
                      value={indicatorLamp}
                      onChange={(e) => setIndicatorLamp(e.target.value)}
                      disabled={!selectedDate}
                      style={{ 
                        width: "100%", 
                        padding: "8px", 
                        border: "1px solid #d0d0d0", 
                        borderRadius: "5px",
                        fontWeight: "500",
                        fontSize: "14px",
                        outline: "none",
                        background: "white"
                      }}
                    >
                      <option value="">-</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e0e0e0", textAlign: "center" }}>
                    <select
                      value={kebersihan}
                      onChange={(e) => setKebersihan(e.target.value)}
                      disabled={!selectedDate}
                      style={{ 
                        width: "100%", 
                        padding: "8px", 
                        border: "1px solid #d0d0d0", 
                        borderRadius: "5px",
                        fontWeight: "500",
                        fontSize: "14px",
                        outline: "none",
                        background: "white"
                      }}
                    >
                      <option value="">-</option>
                      <option value="OK">OK</option>
                      <option value="NG">NG</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                    <textarea
                      value={keteranganKondisi}
                      onChange={(e) => setKeteranganKondisi(e.target.value)}
                      disabled={!selectedDate}
                      placeholder="Describe any issues..."
                      rows={3}
                      style={{ 
                        width: "100%", 
                        padding: "8px", 
                        fontSize: "13px", 
                        resize: "vertical",
                        border: "1px solid #d0d0d0",
                        borderRadius: "4px",
                        outline: "none",
                        fontFamily: "inherit"
                      }}
                    />
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                    <textarea
                      value={tindakanPerbaikan}
                      onChange={(e) => setTindakanPerbaikan(e.target.value)}
                      disabled={!selectedDate}
                      placeholder="Action taken..."
                      rows={3}
                      style={{ 
                        width: "100%", 
                        padding: "8px", 
                        fontSize: "13px", 
                        resize: "vertical",
                        border: "1px solid #d0d0d0",
                        borderRadius: "4px",
                        outline: "none",
                        fontFamily: "inherit"
                      }}
                    />
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                    <input
                      type="text"
                      value={pic}
                      onChange={(e) => setPic(e.target.value)}
                      disabled={!selectedDate}
                      placeholder="Name"
                      style={{ 
                        width: "100%", 
                        padding: "8px", 
                        fontSize: "13px",
                        border: "1px solid #d0d0d0",
                        borderRadius: "4px",
                        outline: "none"
                      }}
                    />
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={!selectedDate}
                      style={{ 
                        width: "100%", 
                        padding: "8px",
                        border: "1px solid #d0d0d0",
                        borderRadius: "4px",
                        outline: "none",
                        fontSize: "13px"
                      }}
                    />
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #e0e0e0" }}>
                    <input
                      type="text"
                      value={verify}
                      onChange={(e) => setVerify(e.target.value)}
                      disabled={!selectedDate}
                      placeholder="Name"
                      style={{ 
                        width: "100%", 
                        padding: "8px", 
                        fontSize: "13px",
                        border: "1px solid #d0d0d0",
                        borderRadius: "4px",
                        outline: "none"
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/ga-smoke-detector")}
            style={{
              padding: "11px 28px",
              background: "#757575",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "500",
              fontSize: "15px",
              cursor: "pointer"
            }}
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate}
            style={{
              padding: "11px 28px",
              background: selectedDate ? "#1976d2" : "#e0e0e0",
              color: selectedDate ? "white" : "#9e9e9e",
              border: "none",
              borderRadius: "6px",
              fontWeight: "500",
              fontSize: "15px",
              opacity: selectedDate ? 1 : 0.6,
              cursor: selectedDate ? "pointer" : "not-allowed"
            }}
          >
            Save Inspection
          </button>
        </div>
        {/* Keterangan Cara Pengecekan - Tabel Style */}
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "24px",
          marginTop: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{
            margin: "0 0 20px 0",
            color: "#212121",
            fontSize: "17px",
            fontWeight: "600",
            paddingBottom: "12px",
            borderBottom: "2px solid #1976d2"
          }}>
            📋 KETERANGAN CARA PENGECEKAN
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              border: "1px solid #e0e0e0",
              backgroundColor: "white",
              borderRadius: "6px",
              overflow: "hidden"
            }}>
              <thead>
                <tr style={{
                  backgroundColor: "#e3f2fd",
                  borderBottom: "2px solid #1976d2"
                }}>
                  <th style={{
                    padding: "12px 14px",
                    fontWeight: "600",
                    color: "#1976d2",
                    textAlign: "left",
                    width: "50%",
                    borderRight: "1px solid #bbdefb"
                  }}>ITEM PENGECEKAN</th>
                  <th style={{
                    padding: "12px 14px",
                    fontWeight: "600",
                    color: "#1976d2",
                    textAlign: "left",
                    width: "50%"
                  }}>CARA PENGECEKAN</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    item: "1. Bunyi",
                    ok: "Berbunyi keras",
                    ng: "Tidak berbunyi atau berbunyi pelan",
                    cara: [
                      "1. Tekan tombol fire alarm",
                      "2. Test heat detector dengan api",
                      "3. Test smoke detector dengan asap"
                    ]
                  },
                  {
                    item: "2. Indicator lamp",
                    ok: "Lampu nyala",
                    ng: "Lampu tidak nyala",
                    cara: ["Lihat lampu nyala atau tidak"]
                  },
                  {
                    item: "3. Kebersihan",
                    ok: "Bersih",
                    ng: "Kotor",
                    cara: ["Periksa kebersihan"]
                  },
                  {
                    item: "4. Kondisi lainnya yang tidak layak/bagus",
                    ok: "Masih Baik",
                    ng: "Tidak baik/rusak",
                    cara: ["Cek kondisi lainnya"]
                  }
                ].map((item, index) => (
                  <tr key={index} style={{
                    borderBottom: "1px solid #e0e0e0",
                    backgroundColor: index % 2 === 0 ? "white" : "#fafafa"
                  }}>
                    <td style={{
                      padding: "12px 14px",
                      verticalAlign: "top",
                      borderRight: "1px solid #e0e0e0",
                      fontWeight: "600",
                      color: "#212121",
                      width: "50%"
                    }}>
                      {item.item}
                      <br />
                      <span style={{ fontSize: "11px", color: "#43a047", display: "block", marginTop: "4px" }}>
                        ✓ {item.ok}
                      </span>
                      <span style={{ fontSize: "11px", color: "#e53935", display: "block", marginTop: "4px" }}>
                        ✘ {item.ng}
                      </span>
                    </td>
                    <td style={{
                      padding: "12px 14px",
                      verticalAlign: "top",
                      lineHeight: "1.6",
                      color: "#424242",
                      width: "50%"
                    }}>
                      {item.cara.map((step, i) => (
                        <div key={i} style={{ marginBottom: "4px" }}>
                          {step}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}