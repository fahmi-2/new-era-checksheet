// app/e-checksheet-panel/EChecksheetPanelForm.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import React from "react";
// ✅ Import API helper yang reusable
import {
  getItemsByType,
  getChecklistByDate,
  getAvailableDates,
  getAreasByType,
  ChecklistItem,
  ChecklistData
} from "@/lib/api/checksheet";

// ✅ TAMBAHKAN IMPORT OFFLINE & SCAN VERIFICATION
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { useScanVerification } from "@/lib/hooks/useScanVerification";
import { QrCode } from "lucide-react";

export function EChecksheetPanelForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isInitialized } = useAuth();
  
  // ✅ TAMBAHKAN HOOK CONNECTION & SCAN
  const { isOnline, pendingCount } = useConnection();
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  
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
        // Format area name sesuai database: "NAMA PANEL \u0007 AREA"
        const areaName = `${panelName} \u0007 ${area}`;
        
        const areas = await getAreasByType(TYPE_SLUG);
        const areaItem = areas.find((a: any) => a.name === areaName);
        
        if (areaItem) {
          setAreaId(areaItem.id);
          
          // Load available dates untuk area ini
          const dates = await getAvailableDates(TYPE_SLUG, areaItem.id);
          setAvailableDates(dates);
        } else {
          // Fallback: cari berdasarkan panelName saja
          const fallbackArea = areas.find((a: any) => 
            a.name.startsWith(panelName)
          );
          if (fallbackArea) {
            setAreaId(fallbackArea.id);
            const dates = await getAvailableDates(TYPE_SLUG, fallbackArea.id);
            setAvailableDates(dates);
          } else {
            console.warn(`Area not found: ${areaName}`);
            alert(`Area "${panelName}" tidak ditemukan di database.`);
          }
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

    if (user && isAuthorizedForChecksheet(user)) {
      console.log('✅ Auth verified successfully');
      setAuthVerified(true);
      return;
    }

    // Beri waktu 1.5 detik sebelum redirect
    const verificationTimeout = setTimeout(() => {
      if (!user || !isAuthorizedForChecksheet(user)) {
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

  // ✅ MODIFIKASI handleSave MENGGUNAKAN SMARTFETCH
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

    // Validasi: pastikan semua item diisi
    const allFieldsFilled = inspectionItems.every((item) => 
      answers[`${item.item_key}_hasil`] !== undefined && answers[`${item.item_key}_hasil`] !== ""
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

      const submitData = {
        type: TYPE_SLUG,
        areaId: areaId,
        date: selectedDate,
        data: checklistData,
        userId: user.id || "unknown",
        userName: user.fullName || "Unknown Inspector",
        // Data tambahan dari URL params untuk metadata
        panelName: panelName,
        area: area
      };

      // ✅ GUNAKAN SMARTFETCH UNTUK OFFLINE MODE
      const response = await smartFetch('/api/checksheet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
        queueType: 'panel_inspeksi',
        metadata: { 
          areaCode: `panel-${areaId}`,
          areaType: 'general'
        }
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
        
        // Redirect ke status page setelah 500ms
        setTimeout(() => {
          router.push(`/status-ga/panel?openPanel=${encodeURIComponent(panelName)}`);
        }, 500);
      } else {
        throw new Error(result.message || 'Gagal menyimpan data');
      }
      
    } catch (error) {
      console.error("Error saving checklist data:", error);
      alert("Gagal menyimpan data: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string): void => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Upload foto sudah base64, kompatibel offline
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

          {/* ✅ SCAN & ADMIN VIEW BANNER */}
          {user && ["admin", "superadmin"].includes(user.role) ? (
            <div style={{ padding: "12px 16px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#3730a3", fontSize: "14px", fontWeight: "600" }}>
              <span>👁️ Mode View Admin (Read-Only) — Anda dapat melihat data checksheet tanpa perlu scan QR. Mode simpan di-nonaktifkan.</span>
            </div>
          ) : !isScanned ? (
            <div className="banner banner-warning scan-warning">
              <span>🔒 Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.</span>
              <button 
                onClick={() => router.push("/scan")} 
                className="banner-btn"
                disabled={isSaving}
              >
                <QrCode size={14} /> Scan Sekarang
              </button>
            </div>
          ) : null}

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
                Tanggal Inspeksi:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getMaxDate()}
                disabled={!isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  color: "#0d47a1",
                  padding: "8px 12px",
                  border: "2px solid #1e88e5",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minWidth: "160px",
                  background: isScanned ? "white" : "#f5f5f5",
                  cursor: isScanned ? "text" : "not-allowed"
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
                  disabled={!isScanned}
                  title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                  style={{
                    color: "#0d47a1",
                    padding: "8px 12px",
                    border: "2px solid #1e88e5",
                    borderRadius: "6px",
                    fontSize: "14px",
                    minWidth: "180px",
                    background: isScanned ? "white" : "#f5f5f5",
                    cursor: isScanned ? "pointer" : "not-allowed"
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
                  disabled={!selectedDate || isLoading || !isScanned}
                  title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                  style={{
                    padding: "8px 16px",
                    background: (selectedDate && !isLoading && isScanned) ? "#ff9800" : "#bdbdbd",
                    color: (selectedDate && !isLoading && isScanned) ? "white" : "#9e9e9e",
                    border: "none",
                    borderRadius: "6px",
                    cursor: (selectedDate && !isLoading && isScanned) ? "pointer" : "not-allowed",
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
                    {inspectionItems.map((item, index) => {
                      // ✅ Tentukan tipe input berdasarkan item_key
                      const isTemperatureItem = [
                        'temp_c', 
                        'temp_cable_connect', 
                        'temp_cable',
                        'sambungan_r',
                        'sambungan_s',
                        'sambungan_t'
                      ].includes(item.item_key);
                      
                      // ✅ Tentukan warna background berdasarkan nilai - LOGIKA WARNA BARU
                      const getValueColor = (value: string) => {
                        if (value === "O") return "#c8e6c9"; // Hijau muda
                        if (value === "X") return "#ffcdd2"; // Merah muda
                        return "#f5f5f5"; // Abu-abu
                      };
                      
                      const getValueTextColor = (value: string) => {
                        if (value === "O") return "#2e7d32"; // Hijau tua
                        if (value === "X") return "#c62828"; // Merah tua
                        return "#999"; // Abu-abu
                      };
                      
                      return (
                        <tr key={item.id}>
                          <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", textAlign: "center", fontWeight: "600" }}>{index + 1}</td>
                          <td style={{ padding: "10px 8px", border: "1px solid #0d47a1", lineHeight: "1.5" }}>{item.item_check}</td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1", textAlign: "center" }}>
                            {isTemperatureItem ? (
                              // ✅ TEXT INPUT untuk suhu dan sambungan
                              <input
                                type="text"
                                value={answers[`${item.item_key}_hasil`] || ""}
                                onChange={(e) => handleInputChange(`${item.item_key}_hasil`, e.target.value)}
                                disabled={!selectedDate || !isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                placeholder="Contoh: 45°C"
                                style={{ 
                                  width: "100%", 
                                  padding: "6px", 
                                  border: "1px solid #1e88e5", 
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  textAlign: "center",
                                  background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                                  cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                                }}
                              />
                            ) : (
                              // ✅ DROPDOWN untuk item lainnya dengan WARNA
                              <select
                                value={answers[`${item.item_key}_hasil`] || ""}
                                onChange={(e) => handleInputChange(`${item.item_key}_hasil`, e.target.value)}
                                disabled={!selectedDate || !isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                style={{ 
                                  width: "100%", 
                                  padding: "6px", 
                                  border: "1px solid #1e88e5", 
                                  borderRadius: "4px",
                                  background: (selectedDate && isScanned) ? getValueColor(answers[`${item.item_key}_hasil`] || "") : "#f5f5f5",
                                  color: (selectedDate && isScanned) ? getValueTextColor(answers[`${item.item_key}_hasil`] || "") : "#999",
                                  fontWeight: "600",
                                  cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed"
                                }}
                              >
                                <option value="">-</option>
                                <option value="O" style={{ background: "#c8e6c9", color: "#2e7d32" }}>O</option>
                                <option value="X" style={{ background: "#ffcdd2", color: "#c62828" }}>X</option>
                              </select>
                            )}
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                            <textarea
                              value={answers[`${item.item_key}_keterangan`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_keterangan`, e.target.value)}
                              disabled={!selectedDate || !isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              placeholder="Keterangan jika NG..."
                              rows={2}
                              style={{ 
                                width: "100%", 
                                padding: "6px", 
                                fontSize: "12px", 
                                resize: "vertical",
                                background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                                cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <button
                                onClick={() => openCamera(item.item_key)}
                                disabled={!selectedDate || !isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                                style={{
                                  padding: "4px 8px",
                                  background: (selectedDate && isScanned) ? "#1e88e5" : "#bdbdbd",
                                  color: "white",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed",
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
                                  background: (selectedDate && isScanned) ? "#4caf50" : "#bdbdbd",
                                  color: "white",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: (selectedDate && isScanned) ? "pointer" : "not-allowed",
                                  textAlign: "center"
                                }}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              >
                                🖼️ File
                              </label>
                              <input
                                id={`file-${item.item_key}`}
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={!selectedDate || !isScanned}
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
                                      disabled={!isScanned}
                                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
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
                              disabled={!selectedDate || !isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              placeholder="Tindakan perbaikan..."
                              rows={2}
                              style={{ 
                                width: "100%", 
                                padding: "6px", 
                                fontSize: "12px", 
                                resize: "vertical",
                                background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                                cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                            <input
                              type="text"
                              value={answers[`${item.item_key}_pic`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_pic`, e.target.value)}
                              disabled={!selectedDate || !isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              placeholder="PIC"
                              style={{ 
                                width: "100%", 
                                padding: "6px", 
                                fontSize: "12px",
                                background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                                cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                            <input
                              type="date"
                              value={answers[`${item.item_key}_dueDate`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_dueDate`, e.target.value)}
                              disabled={!selectedDate || !isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              style={{ 
                                width: "100%", 
                                padding: "6px",
                                background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                                cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                              }}
                            />
                          </td>
                          <td style={{ padding: "8px", border: "1px solid #0d47a1" }}>
                            <input
                              type="text"
                              value={answers[`${item.item_key}_verify`] || ""}
                              onChange={(e) => handleInputChange(`${item.item_key}_verify`, e.target.value)}
                              disabled={!selectedDate || !isScanned}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              placeholder="Verifikasi"
                              style={{ 
                                width: "100%", 
                                padding: "6px", 
                                fontSize: "12px",
                                background: (selectedDate && isScanned) ? "white" : "#f5f5f5",
                                cursor: (selectedDate && isScanned) ? "text" : "not-allowed"
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
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
            {!(user && ["admin", "superadmin"].includes(user.role)) ? (
              <button
                onClick={handleSave}
                disabled={!selectedDate || isSaving || !areaId || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                style={{
                  padding: "12px 28px",
                  background: (selectedDate && !isSaving && areaId && isScanned) 
                    ? "linear-gradient(135deg, #1e88e5, #0d47a1)" 
                    : "#bdbdbd",
                  color: (selectedDate && !isSaving && areaId && isScanned) ? "white" : "#9e9e9e",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: (selectedDate && !isSaving && areaId && isScanned) ? "pointer" : "not-allowed",
                  opacity: (selectedDate && !isSaving && areaId && isScanned) ? 1 : 0.6
                }}
              >
                {isSaving ? "⏳ Menyimpan..." : "✓ Simpan Data"}
              </button>
            ) : (
              <div style={{ padding: "12px 24px", background: "#f1f5f9", color: "#64748b", borderRadius: "8px", fontWeight: "600", fontSize: "14px", border: "1px solid #cbd5e1" }}>
                🔒 Mode View Admin (Simpan Di-nonaktifkan)
              </div>
            )}
          </div>

          {/* KETERANGAN CARA PENGECEKAN - SESUAI GAMBAR */}
          <div style={{
            background: "#f9fbfd",
            border: "1px solid #cfd8dc",
            borderRadius: "12px",
            padding: "20px",
            marginTop: "24px",
            fontSize: "13px",
            lineHeight: "1.6",
            color: "#37474f",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            overflowX: "auto"
          }}>
            <h3 style={{
              margin: "0 0 16px 0",
              color: "#0d47a1",
              fontSize: "16px",
              fontWeight: "700",
              letterSpacing: "0.3px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              📋 KETERANGAN CARA PENGECEKAN
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                border: "1px solid #b3e5fc",
                borderRadius: "8px",
                backgroundColor: "white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: "#e3f2fd",
                    borderBottom: "2px solid #1e88e5",
                    textAlign: "left"
                  }}>
                    <th style={{
                      padding: "10px 12px",
                      border: "1px solid #bbdefb",
                      fontWeight: "700",
                      color: "#0d47a1",
                      textAlign: "center",
                      fontSize: "13px"
                    }}>ITEM PENGECEKAN</th>
                    <th style={{
                      padding: "10px 12px",
                      border: "1px solid #bbdefb",
                      fontWeight: "700",
                      color: "#0d47a1",
                      textAlign: "center",
                      fontSize: "13px"
                    }}>CARA PENGECEKAN</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      item: "1. Temperature",
                      ok: "Normal Temp (°C) <50°C",
                      ng: "Temp (°C) ≥50°C",
                      cara: "Alat infra red ditembakkan di dalam panel (suhu ruangan panel)"
                    },
                    {
                      item: "2. Temperature cable connect",
                      ok: "Normal Temp (°C) <50°C",
                      ng: "Temp (°C) ≥50°C",
                      cara: "Alat infra red ditembakkan di dekat terminal / sambungan"
                    },
                    {
                      item: "3. Temperature Cable",
                      ok: "Normal Temp (°C) <50°C",
                      ng: "Temp (°C) ≥50°C",
                      cara: "Alat infra red ditembakkan di dekat kabel"
                    },
                    {
                      item: "4. Bau",
                      ok: "Tidak ada bau terbakar",
                      ng: "Ada bau terbakar",
                      cara: "Dilakukan manual dengan indra penciuman"
                    },
                    {
                      item: "5. Suara",
                      ok: "Tidak ada suara aneh",
                      ng: "Ada suara dengung/berisik",
                      cara: "Dilakukan manual dengan indra pendengaran"
                    },
                    {
                      item: "6. Sistem Grounding",
                      ok: "Pengecekan secara visual",
                      ng: "Kondisi tidak baik",
                      cara: "Pengecekan secara visual"
                    },
                    {
                      item: "7. Kondisi kabel dan isolasinya",
                      ok: "Kabel tidak rusak, isolasi baik",
                      ng: "Kabel rusak/berkarat",
                      cara: "Cek visual kelayakan kondisi kabel dan isolasinya"
                    },
                    {
                      item: "8. Indikator Panel",
                      ok: "Lampu indikator menyala",
                      ng: "Lampu indikator mati",
                      cara: "Lampu indikator menyala jika ada aliran listrik"
                    },
                    {
                      item: "9. ELCB",
                      ok: "Cek posisi tuas ELCB",
                      ng: "ELCB tidak berfungsi",
                      cara: "Cek posisi tuas ELCB"
                    },
                    {
                      item: "10. Safety warning",
                      ok: "Terdapat safety warning AREA TEGANGAN TINGGI",
                      ng: "Tidak ada safety warning",
                      cara: "Pastikan terdapat safety warning AREA TEGANGAN TINGGI, Akses buka tutup pintu panel tidak terhalang"
                    },
                    {
                      item: "11. Kondisi Sambungan RST",
                      ok: "Normal Temp (°C) <50°C",
                      ng: "Temp (°C) ≥50°C",
                      cara: "Alat infra red ditembakkan di dalam panel (suhu ruangan panel)"
                    },
                    {
                      item: "12. Box Panel",
                      ok: "Box Panel Bersih, tidak berkarat, tidak terlubang dan tidak penyok",
                      ng: "Box Panel kotor/berkarat",
                      cara: "Box Panel Bersih, tidak berkarat, tidak terlubang dan tidak penyok"
                    },
                    {
                      item: "13. 5S",
                      ok: "Pastikan kondisi dalam dan luar box panel bersih dan tidak ada kotoran",
                      ng: "Area panel kotor/berantakan",
                      cara: "Pastikan kondisi dalam dan luar box panel bersih dan tidak ada kotoran"
                    }
                  ].map((item, index) => (
                    <tr key={index} style={{
                      borderBottom: "1px solid #e0e0e0",
                      backgroundColor: index % 2 === 0 ? "white" : "#fafafa"
                    }}>
                      <td style={{
                        padding: "10px 12px",
                        border: "1px solid #e0e0e0",
                        verticalAlign: "top",
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
                        padding: "10px 12px",
                        border: "1px solid #e0e0e0",
                        verticalAlign: "top",
                        lineHeight: "1.6",
                        color: "#424242",
                        width: "50%"
                      }}>
                        {item.cara}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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

      {/* ✅ CSS UNTUK BANNER */}
      <style jsx>{`
        .banner {
          border-radius: 10px;
          padding: 12px 18px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }
        .banner-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          color: #92400e;
          box-shadow: 0 2px 8px rgba(245,158,11,0.12);
        }
        .banner-btn {
          margin-left: auto;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          border-radius: 7px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(245,158,11,0.3);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
        }
        .banner-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(245,158,11,0.4);
        }
        .banner-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .scan-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b;
          justify-content: space-between;
        }
        .scan-warning .banner-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          padding: 8px 16px;
        }
        .scan-warning .banner-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.4);
        }
      `}</style>
    </div>
  );
}