// app/e-checksheet-tg-listrik/EChecksheetTgListrikForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import React from "react";

interface ChecksheetEntry {
  date: string;
  hasilPemeriksaan: string;
  keteranganTemuan: string;
  tindakanPerbaikan: string;
  pic: string;
  dueDate: string;
  verify: string;
  inspector: string;
  images: string[];
}

interface SavedData {
  [itemKey: string]: ChecksheetEntry[];
}

export function EChecksheetTgListrikForm({
  areaName,
  lokasi,
}: {
  areaName: string;
  lokasi: string;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // ✅ SEMUA HOOKS DI ATAS — TANPA KONDISI
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedData, setSavedData] = useState<SavedData>({});
  const [images, setImages] = useState<{ key: string; url: string }[]>([]);

  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>("");

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currentItemKey, setCurrentItemKey] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ✅ Semua useEffect di atas
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      const key = `e-checksheet-tg-listrik-${areaName}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedData(parsed);
      }
    } catch (err) {
      console.warn("Failed to parse saved data");
    }
  }, [isMounted, areaName]);

  useEffect(() => {
    if (!isMounted || loading) return;
    if (!user || (user.role !== "inspector-ga")) {
      router.push("/login-page");
    }
  }, [user, loading, router, isMounted]);

  // ✅ useEffect untuk kamera — tetap di atas
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

  // ✅ Baru di sini boleh ada conditional return
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

  const inspectionItems = [
    {
      no: 1,
      itemGroup: "Sistem Penggerak",
      image: "1-sistem_penggerak.jpg",
      itemCek: "Roda/Ban Masih Layak dan tidak seret dan mudah gerak",
      metode: "Visual & Dicoba",
      key: "sistemPenggerak"
    },
    {
      no: 2,
      itemGroup: "Sistem Hidrolik",
      image: "2.1-sitem_hidrolik1.jpg",
      itemCek: "Rantai Penarik Hidrolis Tidak putus, Tidak Terlalu Kencang terlalu kendor",
      metode: "Visual & Dicoba",
      key: "rantaiPenarik"
    },
    {
      no: 3,
      itemGroup: "Sistem Hidrolik",
      image: "2.2-sitem_hidrolik2.jpg",
      itemCek: "Kondisi Kabel Hidrolis Tidak lecet",
      metode: "Dicoba",
      key: "kabelHidrolis"
    },
    {
      no: 4,
      itemGroup: "Sistem Hidrolik",
      image: "3-sitem_hidrolik3.jpg",
      itemCek: "Mudah di putar, masih dalam kondisi pelumasan",
      metode: "Dicoba",
      key: "pelumasanSistem"
    },
    {
      no: 5,
      itemGroup: "Emergency Brake",
      image: "4-emergency_brake.jpg",
      itemCek: "Putar ke kiri untuk membuka angin",
      metode: "Dicoba",
      key: "emergencyBrake"
    },
    {
      no: 6,
      itemGroup: "Kaki Penumpu (Outrigger)",
      image: "5-kaki_penunggu1.jpg",
      itemCek: "Rumah Lengan Penumpu",
      metode: "Visual",
      key: "rumahLenganPenumpu"
    },
    {
      no: 7,
      itemGroup: "Kaki Penumpu (Outrigger)",
      image: "6-kaki_penunggu2.jpg",
      itemCek: "Lengan-Lengan Penumpu",
      metode: "Visual",
      key: "lenganPenumpu"
    },
    {
      no: 8,
      itemGroup: "Kaki Penumpu (Outrigger)",
      image: "7-kaki_penunggu3.jpg",
      itemCek: "Telapak Penumpu",
      metode: "Visual",
      key: "telapakPenumpu"
    },
    {
      no: 9,
      itemGroup: "Kaki Penumpu (Outrigger)",
      image: "8-kaki_penunggu4.jpg",
      itemCek: "Pengikat Rumah Penumpu",
      metode: "Visual & Dicoba",
      key: "pengikatRumahPenumpu"
    },
    {
      no: 10,
      itemGroup: "Kaki Penumpu (Outrigger)",
      image: "9-kaki_penunggu5.jpg",
      itemCek: "Kunci Pengaman Penumpu",
      metode: "Visual & Dicoba",
      key: "kunciPengamanPenumpu"
    },
    {
      no: 11,
      itemGroup: "Limit switch UP (Batas Ketinggian Maksimal)",
      image: "10-Limit switch UP.jpg",
      itemCek: "Sensor Masih berfungsi",
      metode: "Dicoba",
      key: "limitSwitchUp"
    },
    {
      no: 12,
      itemGroup: "Push button :",
      image: "11.1-pb_naik_turun_indic.jpg",
      itemCek: "Push button (ditekan apakah masih berfungsi dengan baik saat naik)",
      metode: "Dicoba",
      key: "pushButtonNaik"
    },
    {
      no: 13,
      itemGroup: "Push button :",
      image: "11.2-emergency_stop.jpg",
      itemCek: "Emergency Stop ditekan apakah masih sesuai fungsinya",
      metode: "Dicoba",
      key: "emergencyStop"
    },
    {
      no: 14,
      itemGroup: "Kondisi Keranjang",
      image: "12-kondisi_keranjang1.jpg",
      itemCek: "keranjang tidak berkarat, masih layak & bawah keranjang tidak ada kotoran/sampah",
      metode: "Visual",
      key: "keranjangKondisi"
    },
    {
      no: 15,
      itemGroup: "Kondisi Keranjang",
      image: "13.1-kondisi_keranjang2.jpg",
      itemCek: "Engsel Keranjang tidak seret dan tidak berkarat, baut mur kencang",
      metode: "Visual",
      key: "engselKeranjang1"
    },
    {
      no: 16,
      itemGroup: "Kondisi Keranjang",
      image: "13.2-kondisi_keranjang3.jpg",
      itemCek: "Engsel Keranjang tidak seret dan tidak berkarat, baut mur kencang",
      metode: "Visual & Dicoba",
      key: "engselKeranjang2"
    },
    {
      no: 17,
      itemGroup: "Pompa Hidrolik",
      image: "14-pompa_hidrolik.jpg",
      itemCek: "awp Tidak bunyi, hidrolik tidak seret dan masih terlumasi,tidak berkarat",
      metode: "Visual",
      key: "pompaHidrolik"
    },
    {
      no: 18,
      itemGroup: "Selang Penghubung",
      image: "15-selang_penghubung.jpg",
      itemCek: "Ada Cover , bersih dan tidak putus",
      metode: "Visual",
      key: "selangPenghubung"
    },
    {
      no: 19,
      itemGroup: "Electrical Box",
      image: "16-electrical_box.jpg",
      itemCek: "Bersih, cat masih bagus, terdapat ID dan kunci",
      metode: "Visual",
      key: "electricalBox"
    },
    {
      no: 20,
      itemGroup: "Water Pass",
      image: "17-water_pass.jpg",
      itemCek: "Sesuai level",
      metode: "Visual",
      key: "waterPass"
    }
  ];

  const groupedItems = inspectionItems.reduce((acc: Record<string, typeof inspectionItems>, item) => {
    if (!acc[item.itemGroup]) acc[item.itemGroup] = [];
    acc[item.itemGroup].push(item);
    return acc;
  }, {});

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

  const handleSave = () => {
    if (!selectedDate) {
      alert("Pilih tanggal pemeriksaan terlebih dahulu!");
      return;
    }

    const allFieldsFilled = inspectionItems.every((item) => answers[`${item.key}_hasil`]);
    if (!allFieldsFilled) {
      alert("Mohon isi Hasil Pemeriksaan untuk semua item!");
      return;
    }

    try {
      const newData: SavedData = { ...savedData };

      inspectionItems.forEach((item) => {
        const entry: ChecksheetEntry = {
          date: selectedDate,
          hasilPemeriksaan: answers[`${item.key}_hasil`] || "",
          keteranganTemuan: answers[`${item.key}_keterangan`] || "",
          tindakanPerbaikan: answers[`${item.key}_tindakan`] || "",
          pic: answers[`${item.key}_pic`] || "",
          dueDate: answers[`${item.key}_dueDate`] || "",
          verify: answers[`${item.key}_verify`] || "",
          inspector: user.fullName || "",
          images: images.filter(img => img.key === item.key).map(img => img.url)
        };

        if (!newData[item.key]) newData[item.key] = [];
        const existingIndex = newData[item.key].findIndex((e) => e.date === selectedDate);
        if (existingIndex >= 0) {
          newData[item.key][existingIndex] = entry;
        } else {
          newData[item.key].push(entry);
        }
        newData[item.key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });

      const key = `e-checksheet-tg-listrik-${areaName}`;
      localStorage.setItem(key, JSON.stringify(newData));
      alert(`Data berhasil disimpan untuk tanggal ${new Date(selectedDate).toLocaleDateString("id-ID")}`);
      router.push(`/status-ga/tg-listrik?openArea=${encodeURIComponent(areaName)}`);
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      alert("Gagal menyimpan data.");
    }
  };

  const handleLoadExisting = () => {
    if (!selectedDate) {
      alert("Pilih tanggal terlebih dahulu!");
      return;
    }

    const existingData: Record<string, string> = {};
    let found = false;

    inspectionItems.forEach((item) => {
      const entries = savedData[item.key] || [];
      const entry = entries.find((e) => e.date === selectedDate);
      if (entry) {
        found = true;
        existingData[`${item.key}_hasil`] = entry.hasilPemeriksaan;
        existingData[`${item.key}_keterangan`] = entry.keteranganTemuan;
        existingData[`${item.key}_tindakan`] = entry.tindakanPerbaikan;
        existingData[`${item.key}_pic`] = entry.pic;
        existingData[`${item.key}_dueDate`] = entry.dueDate;
        existingData[`${item.key}_verify`] = entry.verify;
      }
    });

    if (found) {
      setAnswers(existingData);
      const loadedImages: { key: string; url: string }[] = [];
      inspectionItems.forEach(item => {
        const entries = savedData[item.key] || [];
        const entry = entries.find(e => e.date === selectedDate);
        if (entry?.images) {
          entry.images.forEach(url => {
            loadedImages.push({ key: item.key, url });
          });
        }
      });
      setImages(loadedImages);
      alert("Data berhasil dimuat!");
    } else {
      alert("Tidak ada data untuk tanggal ini.");
      setAnswers({});
      setImages([]);
    }
  };

  const getAllSavedDates = (): string[] => {
    const dates = new Set<string>();
    Object.values(savedData).forEach((entries: ChecksheetEntry[]) => {
      if (Array.isArray(entries)) {
        entries.forEach(entry => {
          if (entry?.date) dates.add(entry.date);
        });
      }
    });
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const availableDates = getAllSavedDates();

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
            <h1 style={{ margin: "0 0 8px 0", color: "white", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: "700" }}>
              Check Sheet Tangga Listrik (AWP)
            </h1>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>
              Form Pemeriksaan Aerial Work Platform – 2x/bulan
            </p>
          </div>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            <div className="text-black"><strong>Nama Area:</strong> {areaName}</div>
            <div className="text-black"><strong>Lokasi:</strong> {lokasi}</div>
            <div className="text-black"><strong>PIC:</strong> {user.fullName}</div>
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
            <strong style={{ color: "#0d47a1" }}>📅 Jadwal Inspeksi Bulan Ini (2x)</strong>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <label style={{ fontWeight: "700", color: "#0d47a1" }}>Tanggal Inspeksi:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <label style={{ fontWeight: "700", color: "#0d47a1" }}>Riwayat Isian:</label>
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
                {availableDates.map(date => (
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
                  cursor: selectedDate ? "pointer" : "not-allowed"
                }}
              >
                Muat Data
              </button>
            </div>
          )}
        </div>

        {/* Checksheet Table */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "2px solid #0d47a1",
          marginBottom: "20px"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "1200px", border: "2px solid #0d47a1" }}>
              <thead>
                <tr style={{ background: "#e3f2fd" }}>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "40px" }}>No</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "120px" }}>ITEM</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>GAMBAR ITEM</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "200px" }}>ITEM CEK</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>METODE</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>KONDISI</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>KETERANGAN HASIL PENGECEKAN</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>DOKUMENTASI</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", minWidth: "180px" }}>TINDAKAN PERBAIKAN</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>PIC</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "100px" }}>DUE DATE</th>
                  <th style={{ padding: "10px", border: "1px solid #0d47a1", fontWeight: "700", color: "#01579b", textAlign: "center", width: "80px" }}>VERIFIKASI</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                  <React.Fragment key={groupName}>
                    {groupItems.map((item, index) => (
                      <tr key={item.key}>
                        {index === 0 && (
                          <td rowSpan={groupItems.length} style={{
                            padding: "8px",
                            border: "1px solid #0d47a1",
                            textAlign: "center",
                            fontWeight: "600",
                            verticalAlign: "top"
                          }}>
                            {item.no}
                          </td>
                        )}
                        {index === 0 && (
                          <td rowSpan={groupItems.length} style={{
                            padding: "8px",
                            border: "1px solid #0d47a1",
                            textAlign: "center",
                            fontWeight: "600",
                            verticalAlign: "top"
                          }}>
                            {groupName}
                          </td>
                        )}
                        <td style={{
                          padding: "8px",
                          border: "1px solid #0d47a1",
                          textAlign: "center",
                          verticalAlign: "top"
                        }}>
                          <img
                            src={`/tangga_listrik/${item.image}`}
                            alt={item.itemCek}
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%23999' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                              e.currentTarget.style.backgroundColor = "#f5f5f5";
                              e.currentTarget.style.border = "1px dashed #999";
                            }}
                            style={{
                              maxWidth: "80px",
                              maxHeight: "80px",
                              objectFit: "contain",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              cursor: "pointer",
                              transform: "scale(1)"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImage(`/tangga_listrik/${item.image}`);
                              setShowImageModal(true);
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          />
                        </td>
                        <td style={{
                          padding: "8px",
                          border: "1px solid #0d47a1",
                          lineHeight: "1.4",
                          verticalAlign: "top"
                        }}>
                          {item.itemCek}
                        </td>
                        <td style={{
                          padding: "8px",
                          border: "1px solid #0d47a1",
                          textAlign: "center",
                          verticalAlign: "top"
                        }}>
                          {item.metode}
                        </td>
                        <td style={{
                          padding: "8px",
                          border: "1px solid #0d47a1",
                          textAlign: "center",
                          verticalAlign: "top"
                        }}>
                          <select
                            value={answers[`${item.key}_hasil`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_hasil`, e.target.value)}
                            disabled={!selectedDate}
                            style={{
                              width: "100%",
                              padding: "4px",
                              border: "1px solid #1e88e5",
                              borderRadius: "4px",
                              fontSize: "11px"
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
                          verticalAlign: "top"
                        }}>
                          <textarea
                            value={answers[`${item.key}_keterangan`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_keterangan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Keterangan..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "4px",
                              fontSize: "11px",
                              resize: "vertical"
                            }}
                          />
                        </td>
                        <td style={{
                          padding: "8px",
                          border: "1px solid #0d47a1",
                          verticalAlign: "top"
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <button
                              onClick={() => openCamera(item.key)}
                              style={{
                                padding: "4px 8px",
                                background: "#1e88e5",
                                color: "white",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: "pointer",
                                textAlign: "center",
                                whiteSpace: "nowrap"
                              }}
                            >
                              📷 Kamera
                            </button>
                            <label
                              htmlFor={`file-${item.key}`}
                              style={{
                                padding: "4px 8px",
                                background: "#4caf50",
                                color: "white",
                                borderRadius: "4px",
                                fontSize: "11px",
                                cursor: "pointer",
                                textAlign: "center",
                                whiteSpace: "nowrap"
                              }}
                            >
                              🖼️ File
                            </label>
                            <input
                              id={`file-${item.key}`}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleImageUpload(e, item.key)}
                              style={{ display: "none" }}
                            />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                              {images.filter(img => img.key === item.key).map((img, idx) => (
                                <div key={idx} style={{ position: "relative", width: "60px", height: "60px", borderRadius: "4px", overflow: "hidden", cursor: "pointer" }}>
                                  <img
                                    src={img.url}
                                    alt={`Dokumentasi ${item.key} ${idx + 1}`}
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
                                      removeImage(images.findIndex(i => i.key === item.key && i.url === img.url));
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
                          verticalAlign: "top"
                        }}>
                          <textarea
                            value={answers[`${item.key}_tindakan`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_tindakan`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Tindakan..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "4px",
                              fontSize: "11px",
                              resize: "vertical"
                            }}
                          />
                        </td>
                        <td style={{
                          padding: "8px",
                          border: "1px solid #0d47a1",
                          verticalAlign: "top"
                        }}>
                          <input
                            type="text"
                            value={answers[`${item.key}_pic`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_pic`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="PIC"
                            style={{
                              width: "100%",
                              padding: "4px",
                              fontSize: "11px"
                            }}
                          />
                        </td>
                        <td style={{
                          padding: "8px",
                          border: "1px solid #0d47a1",
                          verticalAlign: "top"
                        }}>
                          <input
                            type="date"
                            value={answers[`${item.key}_dueDate`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_dueDate`, e.target.value)}
                            disabled={!selectedDate}
                            style={{
                              width: "100%",
                              padding: "4px",
                              fontSize: "11px"
                            }}
                          />
                        </td>
                        <td style={{
                          padding: "8px",
                          border: "1px solid #0d47a1",
                          verticalAlign: "top"
                        }}>
                          <input
                            type="text"
                            value={answers[`${item.key}_verify`] || ""}
                            onChange={(e) => handleInputChange(`${item.key}_verify`, e.target.value)}
                            disabled={!selectedDate}
                            placeholder="Verify"
                            style={{
                              width: "100%",
                              padding: "4px",
                              fontSize: "11px"
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", padding: "20px 0" }}>
          <button
            onClick={() => router.push("/status-ga/tg-listrik")}
            style={{
              padding: "12px 28px",
              background: "#bdbdbd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600"
            }}
          >
            ← Kembali
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDate}
            style={{
              padding: "12px 28px",
              background: selectedDate ? "linear-gradient(135deg, #1e88e5, #0d47a1)" : "#bdbdbd",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              opacity: selectedDate ? 1 : 0.6
            }}
          >
            ✓ Simpan Data
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
      </div>
    </div>
  );
}