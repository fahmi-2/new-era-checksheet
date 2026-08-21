// app/e-checksheet-ins-apd/EChecksheetInsApdForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NavbarStatic } from "@/components/navbar-static";
import { Sidebar } from "@/components/Sidebar";

interface ChecksheetEntry {
  date: string;
  areaName: string;
  areaType: string;
  data: {
    proses: string;
    standartAPD: string[];
    r1: string;
    r2: string;
    r3: string;
    r4: string;
    r5: string;
    r6: string;
    persentaseOk: string;
    problem: string;
    tindakanPerbaikan: string;
    pic: string;
    verify: string;
  }[];
  inspector: string;
}

// Data dari cs-inspeksi-apd.xlsx
const APD_AREAS = [
  {
    id: 1,
    name: "PRE ASSY AREA GENBA C",
    type: "Produksi",
    proses: [
      {
        name: "BONDER",
        standartAPD: ["- Masker kain"]
      },
      {
        name: "RAYCHEM",
        standartAPD: [
          "- Sarung tangan nitrile",
          "- Sarung tangan katun",
          "- Masker 3M (Respiratory)",
          "- Celemek",
          "- Kacamata bening"
        ]
      },
      {
        name: "RAYCHEM (NON ALPHA)",
        standartAPD: [
          "- Masker FKA",
          "- Sarung tangan nitrile"
        ]
      },
      {
        name: "HEAT SHRINK",
        standartAPD: [
          "- Masker kain",
          "- Sarung tangan nitrile"
        ]
      },
      {
        name: "CASTING",
        standartAPD: ["- Back support"]
      },
      {
        name: "CUTTING",
        standartAPD: ["- Back support"]
      },
      {
        name: "CUTTING & RUBBER SEAL",
        standartAPD: [
          "- Back support",
          "- Ear Plug"
        ]
      }
    ]
  },
  {
    id: 2,
    name: "PRE ASSY GENBA A+B",
    type: "Produksi",
    proses: [
      {
        name: "RAYCHEM",
        standartAPD: [
          "- Sarung tangan nitrile",
          "- Masker 3M (Respiratory)",
          "- Celemek",
          "- Kacamata bening"
        ]
      },
      {
        name: "RAYCHEM NON ALPHA",
        standartAPD: [
          "- Masker FKA",
          "- Sarung tangan nitrile"
        ]
      },
      {
        name: "GUN SOLDER (AMERICAN BEAUTY)",
        standartAPD: [
          "- Kacamata bening",
          "- Masker FKA",
          "- Sarung tangan nitrile",
          "- Celemek"
        ]
      },
      {
        name: "DIP SOLDER",
        standartAPD: [
          "- Sarung tangan kulit",
          "- Sarung tangan katun",
          "- Masker FKA",
          "- Topeng Gerinda",
          "- Celemek",
          "- Sleave"
        ]
      },
      {
        name: "BONDER (200D)",
        standartAPD: ["- Masker FKA"]
      },
      {
        name: "BONDER (900B) + DFM",
        standartAPD: ["- Masker FKA"]
      },
      {
        name: "BONDER",
        standartAPD: ["- Masker FKA"]
      },
      {
        name: "BONDER MINIC MN20 (200D)",
        standartAPD: ["- Masker FKA"]
      },
      {
        name: "BONDER MINIC MN20 (900B)",
        standartAPD: ["- Masker FKA"]
      },
      {
        name: "ANTI KOROSI (EJ30 & EJ35)",
        standartAPD: [
          "- Sarung tangan Anti UV",
          "- Masker FKA",
          "- Kacamata/Face shield Anti UV",
          "- Celemek"
        ]
      },
      {
        name: "HEAT SHRINK",
        standartAPD: [
          "- Masker FKA",
          "- Sarung tangan nitrile"
        ]
      },
      {
        name: "CUTTING : Nissan (Genba A)",
        standartAPD: ["- Back support"]
      },
      {
        name: "CUTTING : Nissan (Genba B)",
        standartAPD: ["- Back support"]
      },
      {
        name: "CUTTING : Mazda",
        standartAPD: ["- Back support"]
      },
      {
        name: "CUTTING : 900B & 200D",
        standartAPD: ["- Back support"]
      },
      {
        name: "TRANSFORTER",
        standartAPD: ["- Topi pelindung"]
      },
      {
        name: "CASTING",
        standartAPD: ["- Back support"]
      }
    ]
  }
];

export function EChecksheetInsApdForm({ areaId: initialAreaId }: { areaId: number }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [areaId, setAreaId] = useState<number>(initialAreaId);
  const [savedData, setSavedData] = useState<ChecksheetEntry[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  const area = APD_AREAS.find(a => a.id === areaId) || APD_AREAS[0];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load saved data
  useEffect(() => {
    if (!isMounted) return;
    try {
      const key = `e-checksheet-apd-${areaId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedData(parsed);
      }
    } catch (err) {
      console.warn("Failed to parse saved data");
    }
  }, [isMounted, areaId]);

  // Inisialisasi rows
  useEffect(() => {
    const newRows = [];
    for (const p of area.proses) {
      newRows.push({
        type: "proses",
        proses: p.name,
        r1: "",
        r2: "",
        r3: "",
        r4: "",
        r5: "",
        r6: "",
        persentaseOk: "",
        problem: "",
        tindakanPerbaikan: "",
        pic: "",
        verify: ""
      });
      for (const apd of p.standartAPD) {
        newRows.push({
          type: "apd",
          proses: apd,
          r1: "",
          r2: "",
          r3: "",
          r4: "",
          r5: "",
          r6: "",
          persentaseOk: "",
          problem: "",
          tindakanPerbaikan: "",
          pic: "",
          verify: ""
        });
      }
    }
    setRows(newRows);
  }, [areaId]);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  if (!isMounted) return null;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || (user.role !== "inspector-ga")) {
    return null;
  }

  const handleSave = () => {
    if (!selectedDate) {
      alert("Please select an inspection date");
      return;
    }

    const updatedRows = rows.map(row => {
      if (row.type === "proses") {
        return { ...row, persentaseOk: "" };
      }
      const responses = [row.r1, row.r2, row.r3, row.r4, row.r5, row.r6];
      const okCount = responses.filter(r => r === "✓").length;
      const percentage = ((okCount / 6) * 100).toFixed(0) + "%";
      return { ...row, persentaseOk: percentage };
    });

    try {
      const entry: ChecksheetEntry = {
        date: selectedDate,
        areaName: area.name,
        areaType: area.type,
        data: updatedRows,
        inspector: user.fullName || ""
      };

      const newData = [...savedData];
      const existingIndex = newData.findIndex(e => e.date === selectedDate);

      if (existingIndex >= 0) {
        newData[existingIndex] = entry;
      } else {
        newData.unshift(entry);
      }

      newData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const key = `e-checksheet-apd-${areaId}`;
      localStorage.setItem(key, JSON.stringify(newData));
      alert(`Inspection data saved for ${new Date(selectedDate).toLocaleDateString("en-US")}`);
      router.push(`/status-ga/inspeksi-apd`);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save data");
    }
  };

  const handleLoadExisting = () => {
    if (!selectedDate) {
      alert("Please select a date first");
      return;
    }

    const entry = savedData.find(e => e.date === selectedDate);

    if (entry) {
      setRows(entry.data);
      alert("Data loaded successfully");
    } else {
      alert("No data found for this date");
      const newRows = [];
      for (const p of area.proses) {
        newRows.push({ type: "proses", proses: p.name, r1: "", r2: "", r3: "", r4: "", r5: "", r6: "", persentaseOk: "", problem: "", tindakanPerbaikan: "", pic: "", verify: "" });
        for (const apd of p.standartAPD) {
          newRows.push({ type: "apd", proses: apd, r1: "", r2: "", r3: "", r4: "", r5: "", r6: "", persentaseOk: "", problem: "", tindakanPerbaikan: "", pic: "", verify: "" });
        }
      }
      setRows(newRows);
    }
  };

  // ❌ HAPUS fungsi generateMonthlyDates() — tidak digunakan lagi

  const updateRowField = (index: number, field: string, value: string) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <Sidebar userName={user.fullName} />
      <div style={{ 
        paddingLeft: "95px",
        paddingRight: "25px",
        paddingTop: "25px",
        paddingBottom: "25px", 
        maxWidth: "100%", 
        margin: "0 auto" }}>        
        <div style={{ marginBottom: "28px" }}>
          <div style={{
            background: "#1976d2",
            borderRadius: "8px",
            padding: "24px 28px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <h1 style={{ margin: "0 0 6px 0", color: "white", fontSize: "26px", fontWeight: "600", letterSpacing: "-0.5px" }}>
              APD Inspection Form
            </h1>
            <p style={{ margin: 0, color: "#e3f2fd", fontSize: "14px" }}>
              Monthly APD compliance checklist for {area.name} ({area.type})
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
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Area ID</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{areaId}</span>
            </div>
            <div> 
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Area Name</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{area.name}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Area Type</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{area.type}</span>
            </div>
            <div>
              <span style={{ fontSize: "13px", color: "#757575", display: "block", marginBottom: "4px" }}>Inspector</span>
              <span style={{ fontSize: "15px", fontWeight: "500", color: "#212121" }}>{user.fullName}</span>
            </div>
          </div>
        </div>

        {/* 🔁 Bagian Inspection Schedule yang Dimodifikasi */}
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
            <span style={{ fontSize: "13px", color: "#757575", marginLeft: "8px" }}>• Every month</span>
          </div>

          {/* Input Tanggal Manual */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>Tanggal Inspeksi:</label>
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
                outline: "none",
                minWidth: "160px"
              }}
            />
          </div>

          {/* Dropdown Riwayat Pengisian */}
          {savedData.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontWeight: "500", color: "#424242", fontSize: "14px" }}>Riwayat Isian:</label>
              <select
                value=""
                onChange={(e) => {
                  const date = e.target.value;
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                style={{
                  color: "#212121",
                  padding: "7px 12px",
                  border: "1px solid #d0d0d0",
                  borderRadius: "5px",
                  fontSize: "14px",
                  outline: "none",
                  minWidth: "180px"
                }}
              >
                <option value="">— Pilih tanggal lama —</option>
                {savedData
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <option key={entry.date} value={entry.date}>
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </option>
                  ))}
              </select>
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
          )}
        </div>

        {/* Tabel APD */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          marginBottom: "24px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1600px" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "2px solid #ccc" }}>
                  <th rowSpan={2} style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "4%" }}>NO</th>
                  <th style={{ padding: "10px 8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "12%" }}>PROSES</th>
                  <th rowSpan={2} colSpan={5} style={{ padding: "8px", border: "1px solid #ddd", fontWeight: "600", textAlign: "center", width: "30%" }}>NO. MESIN/NIK</th>
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
                {rows.map((row, idx) => (
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
                      <input
                        value={row.proses}
                        disabled
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontWeight: row.type === "proses" ? "600" : "normal"
                        }}
                      />
                    </td>
                    {[...Array(5)].map((_, i) => {
                      const field = `r${i + 1}` as keyof typeof row;
                      return (
                        <td key={i} style={{ 
                          padding: "6px", 
                          border: "1px solid #ddd", 
                          textAlign: "center",
                          background: "white"
                        }}>
                          {row.type === "proses" ? (
                            <input
                              value={row[field]}
                              onChange={(e) => updateRowField(idx, String(field), e.target.value)}
                              disabled={!selectedDate}
                              placeholder="NIK/Mesin"
                              style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "12px",
                                border: "1px solid #ccc",
                                borderRadius: "3px",
                                background: "#f9f9f9"
                              }}
                            />
                          ) : (
                            <select
                              value={row[field]}
                              onChange={(e) => updateRowField(idx, String(field), e.target.value)}
                              disabled={!selectedDate}
                              style={{
                                width: "100%",
                                padding: "4px",
                                fontSize: "12px",
                                border: "1px solid #ccc",
                                borderRadius: "3px"
                              }}
                            >
                              <option value="">-</option>
                              <option value="✓">✓</option>
                              <option value="✗">✗</option>
                            </select>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ 
                      padding: "8px", 
                      border: "1px solid #ddd", 
                      textAlign: "center",
                      background: "white"
                    }}>
                      {row.persentaseOk}
                    </td>
                    <td colSpan={4} style={{ 
                      padding: "6px", 
                      border: "1px solid #ddd",
                      background: "white"
                    }}>
                      <textarea
                        value={row.problem}
                        onChange={(e) => updateRowField(idx, "problem", e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Alasan tidak memakai APD..."
                        rows={1}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          resize: "vertical",
                          border: "1px solid #ccc",
                          borderRadius: "3px"
                        }}
                      />
                    </td>
                    <td colSpan={4} style={{ 
                      padding: "6px", 
                      border: "1px solid #ddd",
                      background: "white"
                    }}>
                      <textarea
                        value={row.tindakanPerbaikan}
                        onChange={(e) => updateRowField(idx, "tindakanPerbaikan", e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Tindakan perbaikan..."
                        rows={1}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          resize: "vertical",
                          border: "1px solid #ccc",
                          borderRadius: "3px"
                        }}
                      />
                    </td>
                    <td style={{ 
                      padding: "6px", 
                      border: "1px solid #ddd",
                      background: "white"
                    }}>
                      <input
                        type="text"
                        value={row.pic}
                        onChange={(e) => updateRowField(idx, "pic", e.target.value)}
                        disabled={!selectedDate}
                        placeholder="PIC"
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          border: "1px solid #ccc",
                          borderRadius: "3px"
                        }}
                      />
                    </td>
                    <td style={{ 
                      padding: "6px", 
                      border: "1px solid #ddd",
                      background: "white"
                    }}>
                      <input
                        type="text"
                        value={row.verify}
                        onChange={(e) => updateRowField(idx, "verify", e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Verify"
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "12px",
                          border: "1px solid #ccc",
                          borderRadius: "3px"
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/inspeksi-apd")}
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
            ← Kembali
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
            ✓ Simpan Data
          </button>
        </div>
      </div>
    </div>
  );
}