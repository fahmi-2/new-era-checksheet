// app/e-checksheet-inf-jalan/EChecksheetInfJalanForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
// ✅ Import API helper
import {
  getItemsByType,
  getChecklistByDate,
  saveChecklist,
  getAvailableDates,
  ChecklistItem
} from "@/lib/api/checksheet";

export function EChecksheetInfJalanForm({
  areaName,
  kategori,
  lokasi,
}: {
  areaName: string;
  kategori: string;
  lokasi: string;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // ✅ Hardcode type slug untuk page ini
  const TYPE_SLUG = 'inf-jalan';

  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ State untuk gambar
  const [images, setImages] = useState<{ key: string; url: string }[]>([]);

  // ✅ Modal kamera
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentItemKey, setCurrentItemKey] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ✅ Modal preview gambar
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");

  // ✅ Load inspection items dari API
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        console.log('Loaded inspection items:', items);
        setInspectionItems(items);
      } catch (error) {
        console.error("Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist. Silakan coba lagi.");
      }
    };
    loadItems();
  }, []);

  // ✅ Load areaId dan available dates
  useEffect(() => {
    if (!areaName || !kategori || !lokasi || !isMounted) return;
    
    const loadAreaData = async () => {
      try {
        // Format area name sesuai database: "Jalan Utama Produksi A • Jalan Utama • Genba A - Main Road"
        const fullAreaName = `${areaName} • ${kategori} • ${lokasi}`;
        
        const areasRes = await fetch(`/api/ga/checksheet/${TYPE_SLUG}/areas`);
        const areasData = await areasRes.json();
        
        if (!areasData.success) {
          throw new Error(areasData.message || 'Gagal mengambil data area');
        }
        
        // Cari area dengan case-insensitive dan trim
        const areaItem = areasData.data.find((a: any) => 
          a.name.trim().toLowerCase() === fullAreaName.trim().toLowerCase()
        );
        
        if (areaItem) {
          setAreaId(areaItem.id);
          
          // Load available dates untuk area ini
          const dates = await getAvailableDates(TYPE_SLUG, areaItem.id);
          setAvailableDates(dates);
        } else {
          console.warn(`Area not found: ${fullAreaName}`);
          // Coba cari berdasarkan areaName saja sebagai fallback
          const fallbackArea = areasData.data.find((a: any) => 
            a.name.trim().toLowerCase().startsWith(areaName.trim().toLowerCase())
          );
          if (fallbackArea) {
            setAreaId(fallbackArea.id);
            const dates = await getAvailableDates(TYPE_SLUG, fallbackArea.id);
            setAvailableDates(dates);
          } else {
            alert(`Area "${areaName}" tidak ditemukan di database. Silakan hubungi administrator.`);
          }
        }
      } catch (error) {
        console.error("Failed to load area data:", error);
        alert("Gagal memuat data area. Silakan coba lagi.");
      }
    };
    
    loadAreaData();
  }, [areaName, kategori, lokasi, isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  // ✅ Handle kamera modal
  useEffect(() => {
    if (!showCameraModal) return;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Gagal membuka kamera:", err);
        alert("Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan.");
        setShowCameraModal(false);
      });

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCameraModal]);

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

  const handleInputChange = (field: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ Ambil foto dari kamera
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
    setImages(prev => [...prev, { key: currentItemKey, url: imageUrl }]);
    setShowCameraModal(false);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
  };

  // ✅ Upload file gambar
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, itemKey: string) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { key: itemKey, url: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // ✅ Hapus gambar
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ Buka modal preview gambar
  const openImageModal = (imgUrl: string) => {
    setCurrentImage(imgUrl);
    setShowImageModal(true);
  };

  // ✅ Tutup modal preview
  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImage("");
  };

  // ✅ Load data yang sudah ada dari API
  const handleLoadExisting = async () => {
    if (!selectedDate) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }

    if (!areaId) {
      alert("Area tidak valid!");
      return;
    }

    try {
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      
      if (data) {
        const existingData: Record<string, string> = {};
        const loadedImages: { key: string; url: string }[] = [];
        
        Object.entries(data).forEach(([itemKey, entry]) => {
          existingData[`${itemKey}_hasil`] = entry.hasilPemeriksaan;
          existingData[`${itemKey}_keterangan`] = entry.keteranganTemuan || "";
          existingData[`${itemKey}_tindakan`] = entry.tindakanPerbaikan || "";
          existingData[`${itemKey}_pic`] = entry.pic || "";
          existingData[`${itemKey}_dueDate`] = entry.dueDate || "";
          existingData[`${itemKey}_verify`] = entry.verify || "";
          
          // Load images
          if (entry.images && entry.images.length > 0) {
            entry.images.forEach(url => {
              loadedImages.push({ key: itemKey, url });
            });
          }
        });
        
        setAnswers(existingData);
        setImages(loadedImages);
        alert("Data berhasil dimuat!");
      } else {
        alert("Tidak ada data untuk tanggal ini.");
        setAnswers({});
        setImages([]);
      }
    } catch (error) {
      console.error("Error loading existing data:", error);
      alert("Gagal memuat data. Silakan coba lagi.");
    }
  };

  // ✅ Save to API
  const handleSave = async () => {
    if (!user) {
      alert("User belum login");
      router.push("/login-page");
      return;
    }

    if (!selectedDate) {
      alert("Pilih tanggal pemeriksaan terlebih dahulu!");
      return;
    }

    if (!areaId) {
      alert("Area tidak valid!");
      return;
    }

    const allFieldsFilled = inspectionItems.every((item) => answers[`${item.item_key}_hasil`]);
    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }

    try {
      setIsSaving(true);

      // Format data untuk API
      const checklistData: any = {};
      
      inspectionItems.forEach((item) => {
        const itemImages = images
          .filter(img => img.key === item.item_key)
          .map(img => img.url);
        
        checklistData[item.item_key] = {
          date: selectedDate,
          hasilPemeriksaan: answers[`${item.item_key}_hasil`] || "",
          keteranganTemuan: answers[`${item.item_key}_keterangan`] || "",
          tindakanPerbaikan: answers[`${item.item_key}_tindakan`] || "",
          pic: answers[`${item.item_key}_pic`] || "",
          dueDate: answers[`${item.item_key}_dueDate`] || "",
          verify: answers[`${item.item_key}_verify`] || "",
          inspector: user.fullName || "",
          images: itemImages,
          notes: ""
        };
      });

      // Save ke API
      await saveChecklist(
        TYPE_SLUG,
        areaId,
        selectedDate,
        checklistData,
        user.id || "unknown",
        user.fullName || "Unknown Inspector"
      );

      alert(`Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      
      // Redirect ke status page setelah 500ms
      setTimeout(() => {
        router.push(`/status-ga/inf-jalan?openArea=${encodeURIComponent(areaName)}`);
      }, 500);
      
    } catch (error) {
      console.error("Error saving checklist data:", error);
      alert("Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user.fullName} />
      <div style={{
        paddingLeft: "95px",
        paddingRight: "25px",
        paddingTop: "32px",
        paddingBottom: "32px",
        maxWidth: "100%",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            background: "linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 4px 12px rgba(13, 71, 161, 0.15)"
          }}>
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700", letterSpacing: "-0.5px" }}>
              Check Sheet Inspeksi Infrastruktur Jalan
            </h1>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "400" }}>
              Form Pemeriksaan Kelayakan Jalan & Boardess
            </p>
          </div>
        </div>

        {/* Info Area */}
        <div style={{
          background: "white",
          border: "1px solid #e8e8e8",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          marginBottom: "20px"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Nama Area</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{areaName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Kategori</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{kategori}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>Lokasi</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{lokasi}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontWeight: "600", color: "#0d47a1", fontSize: "clamp(11px, 2.5vw, 13px)" }}>PIC Pengecekan</span>
              <span style={{ color: "#333", fontSize: "clamp(12px, 3vw, 14px)", fontWeight: "500" }}>{user.fullName}</span>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div style={{
          background: "white",
          border: "2px solid #1e88e5",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          marginBottom: "20px"
        }}>
          {/* Input Tanggal Manual */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{
              fontWeight: "700",
              color: "#0d47a1",
              fontSize: "clamp(13px, 3vw, 15px)",
              minWidth: "140px"
            }}>
              📅 Tanggal Pemeriksaan:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                padding: "8px 12px",
                border: "2px solid #1e88e5",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#333",
                fontWeight: "600",
                minWidth: "160px"
              }}
            />
          </div>

          {/* Dropdown Riwayat Pengisian */}
          {availableDates.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{
                fontWeight: "700",
                color: "#0d47a1",
                fontSize: "13px",
                minWidth: "140px"
              }}>
                Riwayat Isian:
              </label>
              <select
                value=""
                onChange={(e) => {
                  const date = e.target.value;
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                style={{
                  padding: "8px 12px",
                  border: "2px solid #1e88e5",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#333",
                  fontWeight: "600",
                  minWidth: "180px"
                }}
              >
                <option value="">— Pilih tanggal lama —</option>
                {availableDates
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </option>
                  ))}
              </select>
              <button
                onClick={handleLoadExisting}
                disabled={!selectedDate}
                style={{
                  padding: "8px 16px",
                  background: selectedDate ? "#ff9800" : "#bdbdbd",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: selectedDate ? "pointer" : "not-allowed",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                📂 Muat Data
              </button>
            </div>
          )}

          <p style={{
            margin: "12px 0 0 0",
            fontSize: "12px",
            color: "#666",
            fontStyle: "italic"
          }}>
            💡 Pilih tanggal pemeriksaan, lalu isi form di bawah. Klik "Muat Data" jika ingin mengedit data yang sudah ada.
          </p>
        </div>

        {/* Tabel Checklist */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          overflow: "hidden",
          border: "2px solid #0d47a1",
          marginBottom: "20px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "clamp(11px, 2.5vw, 13px)",
              minWidth: "1000px"
            }}>
              <thead>
                <tr style={{ background: "#e3f2fd" }}>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "50px"
                  }}>No</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "left",
                    minWidth: "300px"
                  }}>Item Pengecekan</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "100px"
                  }}>HASIL<br/>PEMERIKSAAN</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "180px"
                  }}>KETERANGAN TEMUAN</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "180px"
                  }}>DOKUMENTASI</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    minWidth: "180px"
                  }}>TINDAKAN PERBAIKAN</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "80px"
                  }}>PIC</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "100px"
                  }}>DUE DATE</th>
                  <th style={{
                    padding: "10px",
                    border: "1px solid #0d47a1",
                    fontWeight: "700",
                    color: "#01579b",
                    textAlign: "center",
                    width: "80px"
                  }}>VERIFY</th>
                </tr>
              </thead>
              <tbody>
                {inspectionItems.map((item, index) => (
                  <tr key={item.item_key}>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      textAlign: "center",
                      fontWeight: "600",
                      background: "white"
                    }}>
                      {item.no}
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      lineHeight: "1.4",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <div>{item.item_check}</div>
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      textAlign: "center",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <select
                        value={answers[`${item.item_key}_hasil`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_hasil`, e.target.value)}
                        disabled={!selectedDate}
                        style={{
                          width: "100%",
                          padding: "4px",
                          border: "1px solid #1e88e5",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: selectedDate ? "pointer" : "not-allowed",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      >
                        <option value="">-</option>
                        <option value="OK">✓ OK</option>
                        <option value="NG">✗ NG</option>
                      </select>
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <textarea
                        value={answers[`${item.item_key}_keterangan`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_keterangan`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Keterangan..."
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "11px",
                          resize: "vertical",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white",
                      textAlign:"center",
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => {
                              setCurrentItemKey(item.item_key);
                              setShowCameraModal(true);
                            }}
                            disabled={!selectedDate}
                            style={{
                              padding: "4px 8px",
                              background: selectedDate ? "#1e88e5" : "#bdbdbd",
                              color: "white",
                              borderRadius: "4px",
                              fontSize: "11px",
                              cursor: selectedDate ? "pointer" : "not-allowed",
                              textAlign: "center",
                              whiteSpace: "nowrap",
                              border: "none"
                            }}
                          >
                            📷 Kamera
                          </button>
                          <label
                            htmlFor={`file-${item.item_key}`}
                            style={{
                              padding: "4px 8px",
                              background: selectedDate ? "#4caf50" : "#bdbdbd",
                              color: "white",
                              borderRadius: "4px",
                              fontSize: "11px",
                              cursor: selectedDate ? "pointer" : "not-allowed",
                              textAlign: "center",
                              whiteSpace: "nowrap"
                            }}
                          >
                            🖼️ File
                          </label>
                          <input
                            id={`file-${item.item_key}`}
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={!selectedDate}
                            onChange={(e) => handleImageUpload(e, item.item_key)}
                            style={{ display: "none" }}
                          />
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {images.filter(img => img.key === item.item_key).map((img, idx) => (
                            <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "4px", overflow: "hidden", cursor: "pointer" }}>
                              <img
                                src={img.url}
                                alt={`Dokumentasi ${item.item_key} ${idx + 1}`}
                                onClick={() => openImageModal(img.url)}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: "4px"
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(images.findIndex(i => i.key === item.item_key && i.url === img.url));
                                }}
                                style={{
                                  position: "absolute",
                                  top: "2px",
                                  right: "2px",
                                  background: "rgba(0,0,0,0.5)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "50%",
                                  width: "16px",
                                  height: "16px",
                                  fontSize: "10px",
                                  cursor: "pointer",
                                  padding: "0"
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <textarea
                        value={answers[`${item.item_key}_tindakan`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_tindakan`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Tindakan..."
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "11px",
                          resize: "vertical",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <input
                        type="text"
                        value={answers[`${item.item_key}_pic`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_pic`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="PIC"
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "11px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <input
                        type="date"
                        value={answers[`${item.item_key}_dueDate`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_dueDate`, e.target.value)}
                        disabled={!selectedDate}
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "11px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                    <td style={{
                      padding: "8px",
                      border: "1px solid #0d47a1",
                      verticalAlign: "top",
                      background: "white"
                    }}>
                      <input
                        type="text"
                        value={answers[`${item.item_key}_verify`] || ""}
                        onChange={(e) => handleInputChange(`${item.item_key}_verify`, e.target.value)}
                        disabled={!selectedDate}
                        placeholder="Verify"
                        style={{
                          width: "100%",
                          padding: "4px",
                          fontSize: "11px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          opacity: selectedDate ? 1 : 0.5
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center",
          padding: "20px 0",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => router.push("/status-ga/inf-jalan")}
            style={{
              padding: "12px 28px",
              border: "none",
              borderRadius: "8px",
              fontSize: "clamp(13px, 3vw, 14px)",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              minWidth: "160px",
              background: "#bdbdbd",
              color: "white",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
            }}
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate || isSaving}
            style={{
              padding: "12px 28px",
              border: "none",
              borderRadius: "8px",
              fontSize: "clamp(13px, 3vw, 14px)",
              cursor: (selectedDate && !isSaving) ? "pointer" : "not-allowed",
              fontWeight: "600",
              transition: "all 0.3s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              minWidth: "160px",
              background: (selectedDate && !isSaving) ? "linear-gradient(135deg, #1e88e5, #0d47a1)" : "#bdbdbd",
              color: "white",
              boxShadow: "0 2px 8px rgba(13, 71, 161, 0.2)",
              opacity: (selectedDate && !isSaving) ? 1 : 0.6
            }}
          >
            {isSaving ? "Menyimpan..." : "✓ Simpan Data"}
          </button>
        </div>

        {/* Legend Info */}
        <div style={{
          background: "white",
          borderRadius: "10px",
          padding: "16px 20px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e8e8e8",
          marginTop: "20px"
        }}>
          <div style={{
            borderTop: "1px solid #e8e8e8",
            textAlign: "center"
          }}>
            <p style={{
              margin: "12px 0 0 0",
              fontSize: "10px",
              color: "#666",
              fontStyle: "italic"
            }}>
              💡 <strong>Tip:</strong> Gunakan "Kamera" untuk ambil foto langsung, atau "File" untuk unggah dari galeri.
            </p>
          </div>
        </div>
      </div>

      {/* ✅ Modal Kamera */}
      {showCameraModal && (
        <div
          onClick={() => {
            setShowCameraModal(false);
            if (cameraStream) {
              cameraStream.getTracks().forEach(track => track.stop());
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
              maxWidth: "90vw",
              width: "100%",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", color: "#212121" }}>Ambil Foto</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: "100%",
                maxHeight: "60vh",
                borderRadius: "6px",
                background: "#000",
                transform: "scaleX(-1)"
              }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div style={{ marginTop: "16px", display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={captureImage}
                style={{
                  padding: "10px 20px",
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                📸 Ambil Foto
              </button>
              <button
                onClick={() => {
                  setShowCameraModal(false);
                  if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop());
                  }
                }}
                style={{
                  padding: "10px 20px",
                  background: "#757575",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal Preview Gambar */}
      {showImageModal && (
        <div
          onClick={closeImageModal}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              textAlign: "center"
            }}
          >
            <img
              src={currentImage}
              alt="Dokumentasi"
              style={{
                maxHeight: "90vh",
                maxWidth: "90vw",
                objectFit: "contain",
                borderRadius: "8px",
                border: "3px solid white",
              }}
            />
            <div style={{ marginTop: "16px", color: "white", fontSize: "14px" }}>Click outside to close</div>
          </div>
        </div>
      )}
    </div>
  );
}