"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { NavbarStatic } from "@/components/navbar-static"
import React from "react"

export default function EChecksheetPanelPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  // Declare all hooks FIRST, before any early returns or param extraction
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const pName = searchParams.get("panelName") || "Nama Panel"
    if (typeof window === "undefined") return {}
    try {
      const saved = localStorage.getItem(`e-checksheet-panel-${pName}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === "object" && parsed.tempC !== undefined) {
          return {
            "1": parsed.tempC || "",
            "2": parsed.tempCableConnect || "",
            "3": parsed.tempCable || "",
            "4": parsed.bau || "",
            "5": parsed.suara || "",
            "6": parsed.sistemGrounding || "",
            "7": parsed.kondisiKabelIsolasi || "",
            "8": parsed.indikatorPanel || "",
            "9": parsed.elcb || "",
            "10": parsed.safetyWarning || "",
            "11-R": parsed.kondisiSambunganR || "",
            "11-S": parsed.kondisiSambunganS || "",
            "11-T": parsed.kondisiSambunganT || "",
            "12": parsed.boxPanel || "",
            "13": parsed.s5 || "",
            "14": parsed.keteranganNg1 || "",
            signature: "",
          }
        }
        return parsed
      }
      return {}
    } catch (err) {
      console.warn("Failed to parse saved data")
      return {}
    }
  })

  useEffect(() => {
    if (loading) return
    if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
      router.push("/login-page")
    }
  }, [user, loading, router])

  // Now extract params after all hooks
  const panelName = searchParams.get("panelName") || "Nama Panel"
  const area = searchParams.get("area") || "Area"
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
        <style jsx>{`
          .loading-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-size: 1.2rem;
            background: #f5f5f5;
          }
        `}</style>
      </div>
    )
  }

  if (!user || (user.role !== "inspector-ga" && user.role !== "group-leader-qa")) {
    return null
  }

  const inspectionItems = [
    { no: 1, name: "Temp (°C)" },
    { no: 2, name: "Temp Cable Connect" },
    { no: 3, name: "Temp Cable" },
    { no: 4, name: "Bau" },
    { no: 5, name: "Suara" },
    { no: 6, name: "Sistem Grounding" },
    { no: 7, name: "Kondisi kabel dan isolasinya" },
    { no: 8, name: "Indikator panel" },
    { no: 9, name: "ELCB" },
    { no: 10, name: "Safety warning" },
    { no: 11, name: "Kondisi Sambungan", sub: ["R", "S", "T"] },
    { no: 12, name: "Box Panel" },
    { no: 13, name: "5S" },
    { no: 14, name: "Lain-lain" },
  ]

  const handleInputChange = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    if (typeof window !== "undefined") {
      try {
        const newEntry = {
          _savedAt: date,
          tempC: answers["1"] || "",
          tempCableConnect: answers["2"] || "",
          tempCable: answers["3"] || "",
          bau: answers["4"] || "",
          suara: answers["5"] || "",
          sistemGrounding: answers["6"] || "",
          kondisiKabelIsolasi: answers["7"] || "",
          indikatorPanel: answers["8"] || "",
          elcb: answers["9"] || "",
          safetyWarning: answers["10"] || "",
          kondisiSambunganR: answers["11-R"] || "",
          kondisiSambunganS: answers["11-S"] || "",
          kondisiSambunganT: answers["11-T"] || "",
          boxPanel: answers["12"] || "",
          s5: answers["13"] || "",
          keteranganNg1: answers["14"] || "",
        }

        const key = `e-checksheet-panel-${panelName}`
        const existing = localStorage.getItem(key)
        let history: typeof newEntry[] = []

        if (existing) {
          try {
            const parsed = JSON.parse(existing)
            // 🔹 Pastikan history selalu array
            if (Array.isArray(parsed)) {
              history = parsed
            } else if (parsed && typeof parsed === "object" && parsed._savedAt) {
              // Jika data lama berupa objek tunggal, ubah jadi array
              history = [parsed]
            }
            // Batasi histori (opsional)
            // history = history.slice(-30)
          } catch (e) {
            console.warn("Invalid history format")
          }
        }

        // Tambahkan entri baru di awal
        history.unshift(newEntry)
        localStorage.setItem(key, JSON.stringify(history))

        alert("Data berhasil disimpan!")
        router.push(`/ga-panel?openPanel=${encodeURIComponent(panelName)}`)
      } catch (err) {
        console.error("Gagal menyimpan:", err)
        alert("Gagal menyimpan data.")
      }
    }
  }

  return (
    <div className="app-page">
      <NavbarStatic userName={user.fullName} />
      <div className="page-content">
        <div className="header">
          <h1>Check Sheet Inspeksi Panel</h1>
        </div>

        <div className="info-section">
          <div className="info-row">
            <span className="info-label">NAMA PANEL</span>
            <span className="dropdown-panel">: {panelName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">AREA</span>
            <span className="dropdown-panel">: {area}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Tanggal</span>
            <span className="dropdown-panel">: {new Date(date).toLocaleDateString("id-ID")}</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="checksheet-table">
            <thead>
              <tr>
                <th rowSpan={2} className="col-no">NO</th>
                <th rowSpan={2} className="col-item">ITEM PENGECEKAN</th>
                <th rowSpan={2} className="col-date">TANGGAL</th>
              </tr>
            </thead>
            <tbody>
              {inspectionItems.map((item) => {
                if (item.sub) {
                  return (
                    <React.Fragment key={item.no}>
                      <tr>
                        <td rowSpan={item.sub.length} className="col-no">{item.no}</td>
                        <td rowSpan={item.sub.length} className="col-item">{item.name}</td>
                        <td className="col-input">
                          <input
                            type="text"
                            value={answers[`${item.no}-R`] || ""}
                            onChange={(e) => handleInputChange(`${item.no}-R`, e.target.value)}
                            placeholder="R"
                            className="input-field"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="col-input">
                          <input
                            type="text"
                            value={answers[`${item.no}-S`] || ""}
                            onChange={(e) => handleInputChange(`${item.no}-S`, e.target.value)}
                            placeholder="S"
                            className="input-field"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="col-input">
                          <input
                            type="text"
                            value={answers[`${item.no}-T`] || ""}
                            onChange={(e) => handleInputChange(`${item.no}-T`, e.target.value)}
                            placeholder="T"
                            className="input-field"
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                }
                return (
                  <tr key={item.no}>
                    <td className="col-no">{item.no}</td>
                    <td className="col-item">{item.name}</td>
                    <td className="col-input">
                      <input
                        type="text"
                        value={answers[item.no.toString()] || ""}
                        onChange={(e) => handleInputChange(item.no.toString(), e.target.value)}
                        className="input-field"
                      />
                    </td>
                  </tr>
                )
              })}
              <tr>
                <td colSpan={2} className="col-signature-label">TANDA TANGAN / NIK</td>
                <td className="col-input">
                  <input
                    type="text"
                    value={answers["signature"] || ""}
                    onChange={(e) => handleInputChange("signature", e.target.value)}
                    className="input-field"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="action-buttons">
          <button onClick={() => router.push('/ga-panel')} className="btn-secondary">
            Kembali
          </button>
          <button onClick={handleSave} className="btn-primary">
            Simpan
          </button>
        </div>
      </div>

      <style jsx>{`
        .app-page {
          min-height: 100vh;
          background: #f5f5f5;
        }
        .page-content {
          padding: 24px;
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          margin-bottom: 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #0d47a1;
          font-size: 1.8rem;
          font-weight: bold;
        }
        .info-section {
          background: white;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .info-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 1rem;
        }
        .info-label {
          font-weight: bold;
          min-width: 120px;
          color: black;
        }
        .table-wrapper {
          overflow-x: auto;
          margin-bottom: 24px;
        }
        .checksheet-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .checksheet-table th,
        .checksheet-table td {
          border: 1px solid #ccc;
          padding: 10px;
          text-align: center;
          vertical-align: middle;
        }
        .checksheet-table th {
          background: #f5f9ff;
          font-weight: bold;
        }
        .col-no { width: 60px; }
        .col-item { text-align: left; min-width: 250px; }
        .col-date { width: 150px; }
        .col-input input {
          width: 100%;
          padding: 6px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.9rem;
        }
        .col-signature-label {
          text-align: right;
          font-weight: bold;
          background: #f9f9f9;
        }
        .action-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        .btn-primary,
        .btn-secondary {
          padding: 10px 24px;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          font-weight: bold;
        }
        .btn-primary {
          background: #1e88e5;
          color: white;
        }
        .btn-primary:hover {
          background: #0d47a1;
        }
        .btn-secondary {
          background: #bdbdbd;
          color: white;
        }
        .btn-secondary:hover {
          background: #757575;
        }
        .dropdown-panel {
          color: black;
          font-size: 14px;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}