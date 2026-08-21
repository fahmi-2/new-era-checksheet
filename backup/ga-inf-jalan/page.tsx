"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"

interface InfJalanItem {
  no: number
  namaArea: string
  kategori: string
  lokasi: string
}

interface ChecksheetEntry {
  date: string
  hasilPemeriksaan: string
  keteranganTemuan: string
  tindakanPerbaikan: string
  pic: string
  dueDate: string
  verify: string
  inspector: string
}

interface ChecksheetData {
  [itemKey: string]: ChecksheetEntry[]
}

interface ChecksheetDataOld {
  [date: string]: {
    jalanRata: string
    jalanUtama: string
    jalanTambahan: string
    permukaanTidakLicin: string
    tidakAdaLumut: string
    pencahayaanMemadai: string
    markingJelas: string
    trotoarTidakRusak: string
    bentukTrotoarUtuh: string
    warnaTrotoarTerlihat: string
    boardessTidakBerkarat: string
    tidakKeropos: string
    kekuatanPenyangga: string
    fungsiBoardess: string
    warnaBoardess: string
    tidakAdaTumpukan: string
    boardessCorBaik: string
    boardessCorBentuk: string
    boardessCorWarna: string
    boardessCorTidakLicin: string
    inspector: string
  }
}

export default function GaInfJalanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [filterKategori, setFilterKategori] = useState<string>("all")
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
    const found = infraJalan.find((item) => item.namaArea === openArea)
    if (found) {
      setTimeout(() => openDetail(found), 50)
    }
  }, [isMounted, loading, searchParams])

  const infraJalan: InfJalanItem[] = [
    { no: 1, namaArea: "Jalan Utama Produksi A", kategori: "Jalan Utama", lokasi: "Genba A - Main Road" },
    { no: 2, namaArea: "Jalan Utama Produksi B", kategori: "Jalan Utama", lokasi: "Genba B - Main Road" },
    { no: 3, namaArea: "Jalan Utama Produksi C", kategori: "Jalan Utama", lokasi: "Genba C - Main Road" },
    { no: 4, namaArea: "Jalan Utama Warehouse", kategori: "Jalan Utama", lokasi: "Warehouse Area" },
    { no: 5, namaArea: "Jalan Tambahan Genba A", kategori: "Jalan Tambahan", lokasi: "Genba A - Secondary" },
    { no: 6, namaArea: "Jalan Tambahan Genba B", kategori: "Jalan Tambahan", lokasi: "Genba B - Secondary" },
    { no: 7, namaArea: "Trotuar Area Genba A", kategori: "Trotuar", lokasi: "Genba A - Sidewalk" },
    { no: 8, namaArea: "Trotuar Area Genba B", kategori: "Trotuar", lokasi: "Genba B - Sidewalk" },
    { no: 9, namaArea: "Trotuar Area Genba C", kategori: "Trotuar", lokasi: "Genba C - Sidewalk" },
    { no: 10, namaArea: "Boardess Area Produksi A", kategori: "Boardess", lokasi: "Genba A - Safety Border" },
    { no: 11, namaArea: "Boardess Area Produksi B", kategori: "Boardess", lokasi: "Genba B - Safety Border" },
    { no: 12, namaArea: "Boardess Area Warehouse", kategori: "Boardess", lokasi: "Warehouse - Safety Border" },
    { no: 13, namaArea: "Parking Area Roads", kategori: "Jalan Utama", lokasi: "Parking Zone" },
    { no: 14, namaArea: "Pedestrian Walkway", kategori: "Trotuar", lokasi: "Main Building" },
    { no: 15, namaArea: "Loading Dock Area", kategori: "Jalan Tambahan", lokasi: "Warehouse Loading" },
  ]

  const [selectedArea, setSelectedArea] = useState<InfJalanItem | null>(null)
  const [checksheetData, setChecksheetData] = useState<ChecksheetData | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [selectedDateInModal, setSelectedDateInModal] = useState<string>("")
    const [availableDates, setAvailableDates] = useState<string[]>([])

    // Update availableDates & selectedDateInModal saat checksheetData berubah
    useEffect(() => {
    if (!checksheetData) {
        setAvailableDates([])
        setSelectedDateInModal("")
        return
    }

    const allDates = new Set<string>()
    Object.values(checksheetData).forEach((entries: any) => {
        if (Array.isArray(entries)) {
        entries.forEach((entry: any) => {
            if (entry?.date) allDates.add(entry.date)
        })
        }
    })

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    setAvailableDates(sortedDates)
    setSelectedDateInModal(sortedDates[0] || "")
    }, [checksheetData])

  const openDetail = (area: InfJalanItem) => {
    setSelectedArea(area)
    const key = `e-checksheet-inf-jalan-${area.namaArea}`
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
    setSelectedArea(null)
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

  const getAreaStatus = (area: InfJalanItem) => {
    const key = `e-checksheet-inf-jalan-${area.namaArea}`
    const saved = typeof window !== "undefined" ? localStorage.getItem(key) : null
    if (!saved) return { status: "empty", color: "#9e9e9e", label: "Belum Ada Data", completion: "0/7", lastCheck: "-" }

    try {
      const data = JSON.parse(saved)
      
      // Get all unique dates from all items
      const allDates = new Set<string>()
      Object.values(data).forEach((entries: any) => {
        if (Array.isArray(entries)) {
          entries.forEach(entry => allDates.add(entry.date))
        }
      })

      if (allDates.size === 0) return { status: "empty", color: "#9e9e9e", label: "Belum Ada Data", completion: "0/7", lastCheck: "-" }

      // Get the most recent date
      const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      const latestDate = sortedDates[0]
      
      let totalOk = 0
      let totalNg = 0
      let totalChecked = 0

      fieldKeys.forEach(key => {
        const entries = data[key] || []
        const latestEntry = entries.find((e: any) => e.date === latestDate)
        if (latestEntry && latestEntry.hasilPemeriksaan) {
          totalChecked++
          if (latestEntry.hasilPemeriksaan === "OK") totalOk++
          if (latestEntry.hasilPemeriksaan === "NG") totalNg++
        }
      })

      const formattedDate = new Date(latestDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })

      if (totalChecked === 0) return { status: "empty", color: "#9e9e9e", label: "Belum Diperiksa", completion: "0/7", lastCheck: "-" }
      if (totalNg === 0 && totalOk === 7) return { status: "good", color: "#4caf50", label: "Baik", completion: "7/7", lastCheck: formattedDate }
      if (totalNg >= 3) return { status: "critical", color: "#f44336", label: "Critical", completion: `${totalOk}/7`, lastCheck: formattedDate }
      return { status: "warning", color: "#ff9800", label: "Warning", completion: `${totalOk}/7`, lastCheck: formattedDate }
    } catch (e) {
      return { status: "empty", color: "#9e9e9e", label: "Error", completion: "0/7", lastCheck: "-" }
    }
  }

  const inspectionItems = [
    { 
      key: "jalanRata", 
      no: 1, 
      item: "Jalan Rata, tidak bergelombang. Tidak rusak, tidak licin dan tidak berpotensi menyebabkan kecelakaan kerja lainnya"
    },
    { 
      key: "jalanTidakLicin", 
      no: 2, 
      item: "Jalan Tidak licin/ berlumut"
    },
    { 
      key: "pencahayaanMemadai", 
      no: 3, 
      item: "Pencahayaan memadai (cukup terang menyinari area jalan dan sekitarnya)"
    },
    { 
      key: "trotoarTidakRusak", 
      no: 4, 
      item: "Trotuar tidak rusak, dan bentuk masih utuh dan sesuai, warna masih bisa terlihat"
    },
    { 
      key: "boardessTrotuar", 
      no: 5, 
      item: "Boardess trotuar tidak berkarat, tidak keropos dan visualisasi jelas"
    },
    { 
      key: "tidakAdaTumpukan", 
      no: 6, 
      item: "Tidak ada tumpukan diatas boardess / Boardess cor"
    },
    { 
      key: "boardessCor", 
      no: 7, 
      item: "Boardess cor bentukan masih utuh, masih terlihat warnanya dan tidak licin"
    }
  ]

  const fieldKeys = [
    "jalanRata", "jalanTidakLicin", "pencahayaanMemadai", "trotoarTidakRusak",
    "boardessTrotuar", "tidakAdaTumpukan", "boardessCor"
  ]

  const filteredData = infraJalan.filter(item => {
    const matchKategori = filterKategori === "all" || item.kategori === filterKategori
    const matchSearch = item.namaArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
    return matchKategori && matchSearch
  })

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
              GA Infrastruktur Jalan
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "400" }}>
              Manajemen Data Inspeksi Infrastruktur Jalan & Boardess
            </p>
          </div>
        </div>

        {/* Filter & Search */}
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px 20px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e8e8e8"
        }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#0d47a1",
                background: "white",
                cursor: "pointer",
                minWidth: "150px",
                flex: "1 1 150px"
              }}
            >
              <option value="all">Semua Kategori</option>
              <option value="Jalan Utama">Jalan Utama</option>
              <option value="Jalan Tambahan">Jalan Tambahan</option>
              <option value="Trotuar">Trotuar</option>
              <option value="Boardess">Boardess</option>
            </select>
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
                flex: "1 1 200px",
                minWidth: "200px"
              }}
            />
          </div>
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
                  }}>Nama Area</th>
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
                    minWidth: "120px"
                  }}>Kategori</th>
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
                    minWidth: "100px"
                  }}>Status</th>
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
                {filteredData.map((area) => {
                  const status = getAreaStatus(area)
                  return (
                    <tr key={area.no} style={{ transition: "background-color 0.2s ease" }}>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#333"
                      }}>{area.no}</td>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        fontWeight: "500",
                        color: "#1e88e5"
                      }}>{area.namaArea}</td>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        color: "#666",
                        fontSize: "13px"
                      }}>
                        <span style={{
                          padding: "4px 8px",
                          background: "#e3f2fd",
                          color: "#0d47a1",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}>
                          {area.kategori}
                        </span>
                      </td>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        color: "#666",
                        fontSize: "13px"
                      }}>{area.lokasi}</td>
                      <td style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f0f0f0",
                        textAlign: "center"
                      }}>
                        <div style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <span style={{
                            padding: "4px 12px",
                            background: status.color,
                            color: "white",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            textTransform: "uppercase"
                          }}>
                            {status.label}
                          </span>
                          <span style={{ fontSize: "10px", color: "#999", fontWeight: "600" }}>
                            {status.completion}
                          </span>
                          <span style={{ fontSize: "9px", color: "#666", fontWeight: "500" }}>
                            {status.lastCheck}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                          <button
                            onClick={() => openDetail(area)}
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
                            href={`/e-checksheet-inf-jalan?areaName=${encodeURIComponent(area.namaArea)}&kategori=${encodeURIComponent(area.kategori)}&lokasi=${encodeURIComponent(area.lokasi)}`}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail */}
        {/* Modal Detail */}
        {isMounted && showModal && selectedArea && (
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
                padding: "20px 24px",
                background: "linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)",
                borderBottom: "2px solid #e8e8e8",
                flexShrink: 0,
                flexWrap: "wrap",
                gap: "12px"
            }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                <h2 style={{ margin: "0 0 4px 0", color: "#0d47a1", fontSize: "clamp(16px, 4vw, 20px)", fontWeight: "700" }}>
                    Detail Area Jalan
                </h2>
                <p style={{ margin: "4px 0", color: "#1e88e5", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>
                    {selectedArea.namaArea}
                </p>
                <p style={{ margin: "0", color: "#777", fontSize: "clamp(11px, 2.5vw, 12px)" }}>
                    {selectedArea.kategori} - {selectedArea.lokasi}
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

            {/* Dropdown Tanggal */}
            <div style={{
                padding: "12px 20px",
                background: "#f9f9f9",
                borderBottom: "1px solid #e0e0e0"
            }}>
                <label style={{ fontWeight: "600", color: "#0d47a1", marginRight: "12px", fontSize: "13px" }}>
                Pilih Tanggal:
                </label>
                <select
                value={selectedDateInModal || ""}
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
                    {new Date(date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    })}
                    </option>
                ))}
                </select>
            </div>

            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
                {!checksheetData || Object.keys(checksheetData).length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", fontSize: "14px" }}>
                    <p>Belum ada data pengecekan</p>
                </div>
                ) : !selectedDateInModal ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#666", fontSize: "14px" }}>
                    <p>Pilih tanggal untuk melihat detail pemeriksaan</p>
                </div>
                ) : (
                <div>
                    <div style={{ overflowX: "auto" }}>
                    <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "11px",
                        minWidth: "1200px",
                        border: "2px solid #0d47a1"
                    }}>
                        <thead>
                        <tr style={{ background: "#e3f2fd" }}>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            width: "50px"
                            }}>No</th>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            minWidth: "280px"
                            }}>Item Pengecekan</th>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            width: "100px"
                            }}>Tanggal</th>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            width: "100px"
                            }}>Hasil<br/>Pemeriksaan</th>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            minWidth: "180px"
                            }}>Keterangan<br/>Temuan</th>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            minWidth: "180px"
                            }}>Tindakan<br/>Perbaikan</th>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            width: "80px"
                            }}>PIC</th>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            width: "100px"
                            }}>Due Date</th>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            width: "80px"
                            }}>Verify</th>
                            <th style={{
                            padding: "12px 10px",
                            border: "1px solid #0d47a1",
                            fontWeight: "700",
                            color: "#01579b",
                            textAlign: "center",
                            fontSize: "10px",
                            width: "100px"
                            }}>Inspector</th>
                        </tr>
                        </thead>
                        <tbody>
                        {inspectionItems.map((row) => {
                            const entries = (checksheetData?.[row.key] as ChecksheetEntry[]) || [];
                            const entryForDate = entries.find(e => e.date === selectedDateInModal);

                            return (
                            <tr key={row.key}>
                                <td style={{
                                padding: "10px 8px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontWeight: "600",
                                color: "#333",
                                fontSize: "10px",
                                background: "white",
                                verticalAlign: "top"
                                }}>{row.no}</td>
                                <td style={{
                                padding: "10px 8px",
                                border: "1px solid #0d47a1",
                                fontWeight: "500",
                                color: "#333",
                                fontSize: "10px",
                                background: "white",
                                verticalAlign: "top",
                                lineHeight: "1.5"
                                }}>{row.item}</td>
                                <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontSize: "10px",
                                fontWeight: "600",
                                color: "#01579b",
                                background: "#f5f9ff"
                                }}>
                                {new Date(selectedDateInModal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                                </td>
                                <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontSize: "11px",
                                fontWeight: "700",
                                background: entryForDate?.hasilPemeriksaan === "OK" ? "#c8e6c9" : entryForDate?.hasilPemeriksaan === "NG" ? "#ffcdd2" : "#fff",
                                color: entryForDate?.hasilPemeriksaan === "OK" ? "#2e7d32" : entryForDate?.hasilPemeriksaan === "NG" ? "#c62828" : "#999"
                                }}>
                                {entryForDate?.hasilPemeriksaan === "OK" ? "✓ OK" : entryForDate?.hasilPemeriksaan === "NG" ? "✗ NG" : "-"}
                                </td>
                                <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                fontSize: "10px",
                                color: "#555",
                                background: "white",
                                lineHeight: "1.4"
                                }}>
                                {entryForDate?.keteranganTemuan || "-"}
                                </td>
                                <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                fontSize: "10px",
                                color: "#555",
                                background: "white",
                                lineHeight: "1.4"
                                }}>
                                {entryForDate?.tindakanPerbaikan || "-"}
                                </td>
                                <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontSize: "10px",
                                fontWeight: "500",
                                color: "#333",
                                background: "white"
                                }}>
                                {entryForDate?.pic || "-"}
                                </td>
                                <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontSize: "10px",
                                color: "#555",
                                background: "white"
                                }}>
                                {entryForDate?.dueDate 
                                    ? new Date(entryForDate.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) 
                                    : "-"}
                                </td>
                                <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontSize: "10px",
                                fontWeight: "500",
                                color: "#333",
                                background: "white"
                                }}>
                                {entryForDate?.verify || "-"}
                                </td>
                                <td style={{
                                padding: "8px 6px",
                                border: "1px solid #0d47a1",
                                textAlign: "center",
                                fontSize: "10px",
                                fontWeight: "500",
                                color: "#333",
                                background: "#f5f9ff"
                                }}>
                                {entryForDate?.inspector || "-"}
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                    </div>
                </div>
                )}
            </div>

            <div style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "16px 20px",
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