// app/e-checksheet-panel/EChecksheetPanelForm.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import React from "react";
// ✅ Import API helper yang reusable
import {
  getItemsByType,
  getChecklistByDate,
  saveChecklist,
  getAvailableDates,
  getAreasByType,
  ChecklistItem,
  ChecklistData
} from "@/lib/api/checksheet";

export function EChecksheetPanelForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  
  // ✅ Gunakan useSearchParams untuk membaca parameter
  const panelName = searchParams.get('panelName') || 'Panel';
  const area = searchParams.get('area') || 'Area';
  const TYPE_SLUG = 'panel';
  
  // ✅ CRITICAL FIX: State untuk tracking auth verification
  const [isMounted, setIsMounted] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [images, setImages] = useState<{ key: string; url: string }[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentItemKey, setCurrentItemKey] = useState("");
  const [inspectionItems, setInspectionItems] = useState<ChecklistItem[]>([]);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ✅ Load inspection items dari API
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getItemsByType(TYPE_SLUG);
        setInspectionItems(items);
      } catch (error) {
        console.error("Failed to load checklist items:", error);
        alert("Gagal memuat daftar item checklist.");
      }
    };
    loadItems();
  }, []);

  // ✅ Load areaId dan available dates - HANYA SETELAH AUTH VERIFIED
  useEffect(() => {
    if (!panelName || !area || !isMounted || !authVerified) return;
    
    const loadAreaData = async () => {
      try {
        // Format area name sesuai database: "PANEL NAME \u0007 AREA"
        const areaName = `${panelName} \u0007 ${area}`;
        
        const areas = await getAreasByType(TYPE_SLUG);
        const areaItem = areas.find((a: any) => a.name === areaName);
        
        if (areaItem) {
          setAreaId(areaItem.id);
          
          // Load available dates untuk area ini
          const dates = await getAvailableDates(TYPE_SLUG, areaItem.id);
          setAvailableDates(dates);
        } else {
          console.warn(`Area not found: ${areaName}`);
          alert(`Area "${panelName}" tidak ditemukan di database.`);
        }
      } catch (error) {
        console.error("Failed to load area data:", error);
        alert("Gagal memuat data area.");
      }
    };

    loadAreaData();
  }, [panelName, area, isMounted, authVerified]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ CRITICAL FIX: Authentication verification dengan state tracking dan delay
  useEffect(() => {
    if (!isMounted || !isInitialized || authLoading) {
      console.log('⏳ Auth still loading or component not mounted');
      setAuthVerified(false);
      return;
    }

    if (user && user.role === "inspector-ga-electrical") {
      console.log('✅ Auth verified successfully');
      setAuthVerified(true);
      return;
    }

    // Beri waktu 1.5 detik sebelum redirect
    const verificationTimeout = setTimeout(() => {
      if (!user || user.role !== "inspector-ga") {
        console.error('❌ Auth verification failed after delay:', { user, authLoading });
        router.push("/login-page");
      } else {
        setAuthVerified(true);
      }
    }, 1500);

    return () => clearTimeout(verificationTimeout);
  }, [user, authLoading, isInitialized, router, isMounted]);

  // ✅ Camera useEffect
  useEffect(() => {
    if (!showCameraModal) return;
    
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });

        setCameraStream(stream);
        if (videoRef.current) {
          (videoRef.current as any).srcObject = stream;
        }
      } catch (err) {
        console.error("❌ Gagal membuka kamera:", err);
        alert("Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan.");
        setShowCameraModal(false);
      }
    };

    startCamera();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCameraModal]);

  // ✅ Load existing data dari API
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
      setIsLoading(true);
      const data = await getChecklistByDate(TYPE_SLUG, areaId, selectedDate);
      
      if (data) {
        const existingData: Record<string, string> = {};
        const loadedImages: { key: string; url: string }[] = [];

        Object.entries(data).forEach(([itemKey, entry]) => {
          existingData[`${itemKey}_hasil`] = entry.hasilPemeriksaan || "";
          existingData[`${itemKey}_keterangan`] = entry.keteranganTemuan || "";
          existingData[`${itemKey}_tindakan`] = entry.tindakanPerbaikan || "";
          existingData[`${itemKey}_pic`] = entry.pic || "";
          existingData[`${itemKey}_dueDate`] = entry.dueDate || "";
          existingData[`${itemKey}_verify`] = entry.verify || "";

          if (entry.images && Array.isArray(entry.images)) {
            entry.images.forEach((url: string) => {
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
      console.error("Error loading checklist data:", error);
      alert("Gagal memuat data.");
    } finally {
      setIsLoading(false);
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

    const allFieldsFilled = inspectionItems.every((item) => 
      answers[`${item.item_key}_hasil`]
    );

    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }

    try {
      setIsSaving(true);

      const checklistData: ChecklistData = {};
      
      inspectionItems.forEach((item) => {
        checklistData[item.item_key] = {
          date: selectedDate,
          hasilPemeriksaan: answers[`${item.item_key}_hasil`] || "",
          keteranganTemuan: answers[`${item.item_key}_keterangan`] || "",
          tindakanPerbaikan: answers[`${item.item_key}_tindakan`] || "",
          pic: answers[`${item.item_key}_pic`] || "",
          dueDate: answers[`${item.item_key}_dueDate`] || "",
          verify: answers[`${item.item_key}_verify`] || "",
          inspector: user.fullName || "",
          images: images
            .filter(img => img.key === item.item_key)
            .map(img => img.url),
          notes: ""
        };
      });

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
        router.push(`/status-ga/panel?openPanel=${encodeURIComponent(panelName)}`);
      }, 500);
      
    } catch (error) {
      console.error("Error saving checklist data:", error);
      alert("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const openImageModal = (imgUrl: string) => {
    setCurrentImage(imgUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setCurrentImage("");
  };

  const openCamera = (itemKey: string) => {
    setCurrentItemKey(itemKey);
    setShowCameraModal(true);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current as any;
    const canvas = canvasRef.current as any;
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

  // ✅ FIX: Hitung tanggal maksimum dengan benar
  const getMaxDate = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today.toISOString().split('T')[0];
  };

  // ✅ CRITICAL FIX: Tampilkan loading screen selama auth belum verified
  if (!isMounted || !isInitialized || !authVerified) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p style={{ fontSize: "16px", color: "#666" }}>
            {authLoading ? "Loading authentication..." : "Verifying session..."}
          </p>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "8px" }}>
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  // ✅ Hanya render UI jika auth sudah verified
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <Sidebar userName={user?.fullName} />
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
            <h1 style={{
              margin: "0 0 8px 0",
              color: "white",
              fontSize: "clamp(20px, 5vw, 28px)",
              fontWeight: "700"
            }}>
              Check Sheet Inspeksi Panel Listrik
            </h1>
            <p style={{
              margin: 0,
              color: "rgba(255,255,255,0.9)",
              fontSize: "14px"
            }}>
              Form Pemeriksaan Kelayakan Panel Listrik
            </p>
          </div>

          {/* Info Area */}
          <div style={{
            background: "white",
            border: "1px solid #e8e8e8",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            marginBottom: "20px"
          }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: "12px" 
            }}>
              <div style={{ color: "black" }}>
                <strong>Nama Panel:</strong> {panelName}
              </div>
              <div style={{ color: "black" }}>
                <strong>Area:</strong> {area}
              </div>
              <div style={{ color: "black" }}>
                <strong>PIC Pengecekan:</strong> {user?.fullName}
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div style={{
            background: "white",
            border: "2px solid #1e88e5",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            marginBottom: "20px"
          }}>
            <div style={{ marginBottom: "12px" }}>
              <strong style={{ 
                color: "#0d47a1",
                fontSize: "15px"
              }}>
                📅 Jadwal Inspeksi: Setiap Hari
              </strong>
            </div>

            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              flexWrap: "wrap", 
              marginBottom: "12px" 
            }}>
              <label style={{ 
                fontWeight: "700", 
                color: "#0d47a1",
                fontSize: "14px"
              }}>
                Tanggal Pemeriksaan:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getMaxDate()}
                style={{
                  color: "#0d47a1",
                  padding: "8px 12px",
                  border: "2px solid #1e88e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "160px"
                }}
              />
            </div>

            {availableDates.length > 0 && (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                flexWrap: "wrap" 
              }}>
                <label style={{ 
                  fontWeight: "700", 
                  color: "#0d47a1",
                  fontSize: "14px"
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
                    color: "#0d47a1",
                    padding: "8px 12px",
                    border: "2px solid #1e88e5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minWidth: "180px"
                  }}
                >
                  <option value="">— Pilih tanggal lama —</option>
                  {availableDates
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .map((date) => (
                      <option key={date} value={date}>
                        {new Date(date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleLoadExisting}
                  disabled={!selectedDate || isLoading}
                  style={{
                    padding: "8px 16px",
                    background: (selectedDate && !isLoading) ? "#ff9800" : "#bdbdbd",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (selectedDate && !isLoading) ? "pointer" : "not-allowed",
                    fontWeight: "600"
                  }}
                >
                  {isLoading ? "Memuat..." : "Muat Data"}
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

          {/* Checksheet Table */}
          {inspectionItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
              Loading checklist items...
            </div>
          ) : (
            <div style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              overflow: "hidden",
              border: "2px solid #0d47a1",
              marginBottom: "20px"
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", minWidth: "1000px" }}>
                  <thead>
                    <tr style={{ background: "#e3f2fd" }}>
                      <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "50px" }}>No</th>
                      <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "left", minWidth: "250px" }}>ITEM</th>
                      <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>HASIL</th>
                      <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>KETERANGAN N-OK</th>
                      <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>DOKUMENTASI</th>
                      <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                      <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>PIC</th>
                      <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>DUE DATE</th>
                      <th style={{ padding: "12px 8px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>VERIFY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectionItems.map((item, index) => (
                      <tr key={item.id}>
                        <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                        <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", lineHeight: "1.5" }}>{item.item_check}</td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>
                          <select
                            value={answers[`${item.item_key}_hasil`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_hasil`, e.target.value)}
                            disabled={!selectedDate}
                            style={{ width: "100%", padding: "6px", border: "1px solid #1e88e5", borderRadius: "4px" }}
                          >
                            <option value="">-</option>
                            <option value="OK">✓ OK</option>
                            <option value="NG">✗ NG</option>
                          </select>
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <textarea
                            value={answers[`${item.item_key}_keterangan`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_keterangan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Keterangan jika NG..."
                            rows={2}
                            style={{ width: "100%", padding: "6px", fontSize: "12px", resize: "vertical" }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <button
                              onClick={() => openCamera(item.item_key)}
                              disabled={!selectedDate}
                              style={{
                                padding: "4px 8px",
                                background: selectedDate ? "#1e88e5" : "#bdbdbd",
                                color: "white",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: selectedDate ? "pointer" : "not-allowed",
                                textAlign: "center",
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
                                textAlign: "center"
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
                              onChange={(e) => handleImageUpload(e as any, item.item_key)}
                              style={{ display: "none" }}
                            />
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
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <textarea
                            value={answers[`${item.item_key}_tindakan`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_tindakan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Tindakan perbaikan..."
                            rows={2}
                            style={{ width: "100%", padding: "6px", fontSize: "12px", resize: "vertical" }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <input
                            type="text"
                            value={answers[`${item.item_key}_pic`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_pic`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="PIC"
                            style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <input
                            type="date"
                            value={answers[`${item.item_key}_dueDate`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_dueDate`, e.target.value)}
                            disabled={!selectedDate}
                            style={{ width: "100%", padding: "6px" }}
                          />
                        </td>
                        <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                          <input
                            type="text"
                            value={answers[`${item.item_key}_verify`] || ""}
                            onChange={(e) => handleInputChange(`${item.item_key}_verify`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Verifikasi"
                            style={{ width: "100%", padding: "6px", fontSize: "12px" }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: "flex", 
            gap: "12px", 
            justifyContent: "center", 
            padding: "20px 0" 
          }}>
            <button
              onClick={() => router.push("/status-ga/panel")}
              style={{
                padding: "12px 28px",
                background: "#bdbdbd",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              ← Kembali
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedDate || isSaving || !areaId}
              style={{
                padding: "12px 28px",
                background: (selectedDate && !isSaving && areaId) 
                  ? "linear-gradient(135deg, #1e88e5, #0d47a1)" 
                  : "#bdbdbd",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: (selectedDate && !isSaving && areaId) ? "pointer" : "not-allowed",
                opacity: (selectedDate && !isSaving && areaId) ? 1 : 0.6
              }}
            >
              {isSaving ? "⏳ Menyimpan..." : "✓ Simpan Data"}
            </button>
          </div>

          {/* Modal Gambar */}
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
              <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
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
                <div style={{ 
                  marginTop: "16px", 
                  color: "white", 
                  fontSize: "14px" 
                }}>
                  Click outside to close
                </div>
              </div>
            </div>
          )}

          {/* Modal Kamera */}
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
                  padding: "16px 20px",
                  textAlign: "center",
                  maxWidth: "90vw",
                  width: "100%",
                }}
              >
                <h3 style={{ 
                  margin: "0 0 12px 0", 
                  color: "#212121" 
                }}>
                  📸 Ambil Foto
                </h3>
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
                <div style={{ 
                  marginTop: "16px", 
                  display: "flex", 
                  gap: "12px", 
                  justifyContent: "center" 
                }}>
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
        </div>
      </div>
    </div>
  );
}