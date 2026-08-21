// /app/ga-tg-listrik/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

interface TanggaListrikItem {
  no: number
  namaArea: string
  lokasi: string
}

export default function GaTanggaListrikPage() {
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
    const found = tanggaListrik.find((item) => item.namaArea === openArea)
    if (found) {
      setTimeout(() => openDetail(found), 50)
    }
  }, [isMounted, loading, searchParams])

  const tanggaListrik: TanggaListrikItem[] = [
    { no: 1, namaArea: "Tangga Listrik A - Produksi", lokasi: "Genba A" },
    { no: 2, namaArea: "Tangga Listrik B - Warehouse", lokasi: "Gudang Utama" },
    { no: 3, namaArea: "Tangga Listrik C - Maintenance", lokasi: "Workshop" },
    { no: 4, namaArea: "Tangga Listrik D - Loading Dock", lokasi: "Area Bongkar Muat" },
  ]

  const [selectedArea, setSelectedArea] = useState<TanggaListrikItem | null>(null)
  const [checksheetData, setChecksheetData] = useState<any | null>(null)
  const [selectedDateInModal, setSelectedDateInModal] = useState<string>("")
  const [availableDates, setAvailableDates] = useState<string[]>([])

  const openDetail = (area: TanggaListrikItem) => {
    setSelectedArea(area)
    const key = `e-checksheet-tg-listrik-${area.namaArea}`
    const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setChecksheetData(data)

        // Extract all dates
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
    { key: "sistemPenggerak", no: 1, item: "Roda/Ban Masih Layak dan tidak seret dan mudah gerak" },
    { key: "rantaiPenarik", no: 2, item: "Rantai Penarik Hidrolis Tidak putus, Tidak Terlalu Kencang/terlalu kendor" },
    { key: "kabelHidrolis", no: 3, item: "Kondisi Kabel Hidrolis Tidak lecet" },
    { key: "pelumasanSistem", no: 4, item: "Mudah di putar, masih dalam kondisi pelumasan" },
    { key: "emergencyBrake", no: 5, item: "Putar ke kiri untuk membuka angin (Emergency Brake)" },
    { key: "rumahLenganPenumpu", no: 6, item: "Rumah Lengan Penumpu" },
    { key: "lenganPenumpu", no: 7, item: "Lengan-Lengan Penumpu" },
    { key: "telapakPenumpu", no: 8, item: "Telapak Penumpu" },
    { key: "pengikatRumahPenumpu", no: 9, item: "Pengikat Rumah Penumpu" },
    { key: "kunciPengamanPenumpu", no: 10, item: "Kunci Pengaman Penumpu" },
    { key: "limitSwitchUp", no: 11, item: "Limit switch UP (Batas Ketinggian Maksimal) – Sensor berfungsi" },
    { key: "pushButtonNaik", no: 12, item: "Push button Naik – Berfungsi saat ditekan" },
    { key: "emergencyStop", no: 13, item: "Emergency Stop – Berfungsi sesuai fungsinya" },
    { key: "keranjangKondisi", no: 14, item: "Keranjang tidak berkarat, masih layak & bawah keranjang tidak ada kotoran/sampah" },
    { key: "engselKeranjang1", no: 15, item: "Engsel Keranjang tidak seret dan tidak berkarat, baut mur kencang" },
    { key: "engselKeranjang2", no: 16, item: "Engsel Keranjang tidak seret dan tidak berkarat, baut mur kencang" },
    { key: "pompaHidrolik", no: 17, item: "Pompa Hidrolik – Tidak bunyi, hidrolik tidak seret dan masih terlumasi, tidak berkarat" },
    { key: "selangPenghubung", no: 18, item: "Selang Penghubung – Ada Cover, bersih dan tidak putus" },
    { key: "electricalBox", no: 19, item: "Electrical Box – Bersih, cat masih bagus, terdapat ID dan kunci" },
    { key: "waterPass", no: 20, item: "Water Pass – Sesuai level" },
  ]

  const filteredData = tanggaListrik.filter(item =>
    item.namaArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700", letterSpacing: "-0.5px" }}>
              GA Tangga Listrik (AWP)
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "400" }}>
              Manajemen Data Inspeksi Tangga Listrik (Aerial Work Platform)
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e8e8e8"
        }}>
          <input
            type="text"
            placeholder="Cari area atau lokasi..."
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
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
          border: "1px solid #e8e8e8"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>No</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Nama Area</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Lokasi</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", background: "#f5f7fa", fontWeight: "600", color: "#0d47a1", fontSize: "13px", textTransform: "uppercase", borderBottom: "2px solid #e8e8e8" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((area) => {
                  const key = `e-checksheet-tg-listrik-${area.namaArea}`
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
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontWeight: "500", color: "#1e88e5" }}>{area.namaArea}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", color: "#666" }}>{area.lokasi}</td>
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
                            href={`/e-checksheet-tg-listrik?areaName=${encodeURIComponent(area.namaArea)}&lokasi=${encodeURIComponent(area.lokasi)}`}
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
                    Detail Tangga Listrik
                  </h2>
                  <p style={{ margin: "4px 0", color: "#1e88e5", fontWeight: "500" }}>{selectedArea.namaArea}</p>
                  <p style={{ margin: "0", color: "#777", fontSize: "12px" }}>{selectedArea.lokasi}</p>
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
                    color: "#0d47a1",
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
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "300px" }}>Item Pengecekan</th>
                          {/* <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Tanggal</th> */}
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Hasil</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>Keterangan Temuan</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>Tindakan Perbaikan</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>PIC</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Due Date</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>Verify</th>
                          <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>Inspector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectionItems.map(row => {
                          const entries = checksheetData[row.key] || []
                          const entry = entries.find((e: any) => e.date === selectedDateInModal)
                          return (
                            <tr key={row.key}>
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{row.no}</td>
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", lineHeight: "1.4" }}>{row.item}</td>
                              {/* <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center", color: "#01579b" }}>
                                {new Date(selectedDateInModal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                              </td> */}
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
                              <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>{entry?.inspector || "-"}</td>
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