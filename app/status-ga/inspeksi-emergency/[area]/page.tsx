// app/status-ga/inspeksi-emergency/[area]/page.tsx
"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { ArrowLeft, QrCode } from "lucide-react";

// ✅ TAMBAHKAN IMPORT HOOK SCAN VERIFICATION
import { useScanVerification } from "@/lib/hooks/useScanVerification";

const locations = {
  "genba-a": [
    { no: 1, lokasi: "CV AB1", id: "A01" },
    { no: 2, lokasi: "CV AB3", id: "A02" },
    { no: 3, lokasi: "CV AB4", id: "A03" },
    { no: 4, lokasi: "CV AB7", id: "A04" },
    { no: 5, lokasi: "CV AB9", id: "A05" },
    { no: 6, lokasi: "CV 15A", id: "A06" },
    { no: 7, lokasi: "CV 14B", id: "A07" },
    { no: 8, lokasi: "SA AT19", id: "A08" },
    { no: 9, lokasi: "PINTU 7", id: "A09" },
    { no: 10, lokasi: "RAYCHEM 900B", id: "A10" },
    { no: 11, lokasi: "INSERT PLUG AT6", id: "A11" },
    { no: 12, lokasi: "CV AT9", id: "A12" },
    { no: 13, lokasi: "CV AT7", id: "A13" },
    { no: 14, lokasi: "CV AT6", id: "A14" },
    { no: 15, lokasi: "CV AT2", id: "A15" },
    { no: 16, lokasi: "PINTU 9", id: "A16" },
    { no: 17, lokasi: "PRE ASSY AB1", id: "A17" },
    { no: 20, lokasi: "DEPAN QA REC", id: "A18" },
    { no: 21, lokasi: "NEW CUTTING TUBE", id: "A19" },
    { no: 22, lokasi: "UTARA PINTU 2", id: "A20" },
  ],
  "genba-b": [
    { no: 51, lokasi: "PINTU MASUK GENBA B", id: "B01" },
    { no: 52, lokasi: "SEBELAH UTARA", id: "B02" },
    { no: 53, lokasi: "SEBELAH TIMUR", id: "B03" },
    { no: 54, lokasi: "SEBELAH TIMUR", id: "B04" },
    { no: 55, lokasi: "AREA SECOND FLOOR", id: "B05" },
    { no: 56, lokasi: "SEBELAH SELATAN", id: "B06" },
    { no: 57, lokasi: "SAMPING LIFT BARANG", id: "B07" },
    { no: 58, lokasi: "SEBELAH BARAT", id: "B08" },
    { no: 59, lokasi: "SEBELAH BARAT", id: "B09" },
    { no: 60, lokasi: "DI ATAS PANEL", id: "B10" },
  ],
  "genba-c": [
    { no: 61, lokasi: "RECEIVING", id: "C01" },
    { no: 62, lokasi: "CV C7", id: "C02" },
    { no: 63, lokasi: "CV C3", id: "C03" },
    { no: 64, lokasi: "CV C3", id: "C04" },
    { no: 65, lokasi: "PRE ASSY", id: "C05" },
    { no: 66, lokasi: "PRE ASSY", id: "C06" },
    { no: 67, lokasi: "CV C1", id: "C07" },
    { no: 68, lokasi: "CV C1", id: "C08" },
    { no: 69, lokasi: "CV C5", id: "C09" },
    { no: 70, lokasi: "CV C4", id: "C10" },
    { no: 71, lokasi: "PINTU SELATAN", id: "C11" },
    { no: 72, lokasi: "PINTU UTARA", id: "C12" },
  ],
  "jig-proto": [
    { no: 73, lokasi: "SAMPING PINTU", id: "JP01" },
    { no: 74, lokasi: "STOCK CONTROL / NYS", id: "JP02" },
    { no: 75, lokasi: "BOR DUDUK", id: "JP03" },
    { no: 76, lokasi: "OFFICE JIG PROTO", id: "JP04" },
  ],
  "gel-sheet": [
    { no: 77, lokasi: "GEL SHEET/STOK KONTROL", id: "GS01" },
    { no: 78, lokasi: "GEL SHEET", id: "GS02" },
  ],
  "warehouse": [
    { no: 23, lokasi: "RECEIVING WAREHOUSE", id: "WHS01" },
    { no: 24, lokasi: "SAMPING LIFT WAREHOUSE (BAWAH)", id: "WHS02" },
    { no: 25, lokasi: "SAMPING LIFT WHS SISI ATAS", id: "WHS03" },
    { no: 26, lokasi: "SECOND FLOOR WAREHOUSE JALUR TENGAH (SAMPING PAGAR)", id: "WHS04" },
    { no: 27, lokasi: "DEKAT TANGGA SISI BARAT SECOND FLOOR WHS", id: "WHS05" },
  ],
  "mezzanine": [
    { no: 28, lokasi: "TANGGA T08-B /", id: "TM01" },
    { no: 29, lokasi: "TANGGA KARAKURI", id: "TM02" },
    { no: 30, lokasi: "TANGGA REMOT AC", id: "TM03" },
    { no: 31, lokasi: "SAMPING TANGGA SELATAN", id: "MZA-01" },
    { no: 32, lokasi: "J72 MAZDA", id: "MZA-02" },
    { no: 33, lokasi: "J30 MAZDA", id: "MZA-03" },
    { no: 34, lokasi: "CV 900B", id: "MZA-04" },
    { no: 35, lokasi: "CV 900B TOYOTA", id: "MZA-05" },
    { no: 36, lokasi: "J72 MAZDA", id: "MZA-06" },
  ],
  "parkir": [
    { no: 84, lokasi: "PARKIR BAWAH SISI BARAT", id: "PARKIR BAWAH  01" },
    { no: 85, lokasi: "PARKIR BAWAH SISI TIMUR SEBELAH TANGGA", id: "PARKIR BAWAH 02" },
    { no: 86, lokasi: "PARKIR ATAS SISI BARAT", id: "PARKIR ATAS 01" },
    { no: 87, lokasi: "PARKIR ATAS SISI TIMUR SEBELAH TANGGA", id: "PARKIR ATAS 02" },
  ],
  "main-office": [
    { no: 88, lokasi: "PINTU TENGAH MAIN OFFICE", id: "MAIN OFFICE 01" },
    { no: 89, lokasi: "PPIC OFFICE", id: "MAIN OFFICE 02" },
    { no: 90, lokasi: "PP OFFICE SELATAN", id: "MAIN OFFICE 03" },
    { no: 91, lokasi: "PP OFFICE UTARA", id: "MAIN OFFICE 04" },
  ],
};

type StatusFieldKey = 'kondisiLampu' | 'indicatorLamp' | 'batteryCharger' | 'idNumber' | 'kebersihan' | 'kondisiKabel';

const statusFields: { key: StatusFieldKey; label: string }[] = [
  { key: 'kondisiLampu', label: 'Kondisi Lampu' },
  { key: 'indicatorLamp', label: 'Indicator Lamp' },
  { key: 'batteryCharger', label: 'Battery Charger' },
  { key: 'idNumber', label: 'ID Number' },
  { key: 'kebersihan', label: 'Kebersihan' },
  { key: 'kondisiKabel', label: 'Kondisi Kabel' },
];

const statusFieldKeys: StatusFieldKey[] = statusFields.map(f => f.key);

export default function EmergencyLampChecklist({ params }: { params: Promise<{ area: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, pendingCount } = useConnection();
  const { area } = use(params);
  
  // ✅ TAMBAHKAN HOOK INI - WAJIB DI TOP LEVEL
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  
  const date = new Date().toISOString().split("T")[0];

  const [items, setItems] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  // Validasi akses
  useEffect(() => {
    if (!user || !isAuthorizedForChecksheet(user)) {
      router.push("/home");
    }
  }, [user, router]);

  // Inisialisasi data
  useEffect(() => {
    const locs = locations[area as keyof typeof locations] || [];
    const initialItems = locs.map((loc) => ({
      no: loc.no,
      lokasi: loc.lokasi,
      id: loc.id,
      kondisiLampu: "",
      indicatorLamp: "",
      batteryCharger: "",
      idNumber: "",
      kebersihan: "",
      kondisiKabel: "",
      keterangan: "",
      tindakanPerbaikan: "",
      pic: user?.fullName || "",
      foto: "",
    }));
    setItems(initialItems);
  }, [area, user]);

  const handleInputChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // ✅ UPLOAD FOTO MENGGUNAKAN BASE64 (KONSISTEN DENGAN OFFLINE MODE)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange(index, "foto", reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    handleInputChange(index, "foto", "");
  };

  const handleShowPreview = () => {
    for (const item of items) {
      for (const field of statusFieldKeys) {
        if (!item[field]) {
          alert("⚠️ Semua kolom status harus diisi!");
          return;
        }
      }
    }

    const ngExists = items.some(
      (item) =>
        item.kondisiLampu === "NG" ||
        item.indicatorLamp === "NG" ||
        item.batteryCharger === "NG" ||
        item.idNumber === "NG" ||
        item.kebersihan === "NG" ||
        item.kondisiKabel === "NG"
    );

    if (ngExists) {
      const missingKeterangan = items.some(
        (item) =>
          (item.kondisiLampu === "NG" ||
            item.indicatorLamp === "NG" ||
            item.batteryCharger === "NG" ||
            item.idNumber === "NG" ||
            item.kebersihan === "NG" ||
            item.kondisiKabel === "NG") &&
          (!item.keterangan || item.keterangan.trim() === "")
      );
      if (missingKeterangan) {
        alert("⚠️ Harap isi kolom 'Keterangan' untuk semua item yang berstatus NG!");
        return;
      }
    }
    setHasNg(ngExists);
    setShowPreview(true);
  };

  const handleCancelPreview = () => setShowPreview(false);

  const handleSave = async () => {
    try {
      setLoading(true);

      for (let index = 0; index < items.length; index++) {
        const item = items[index];

        if (!item.no) throw new Error(`Baris ${index + 1}: Nomor urut tidak boleh kosong`);
        if (!item.lokasi || item.lokasi.trim() === '') throw new Error(`Baris ${index + 1}: Lokasi wajib diisi`);
        if (!item.id || item.id.trim() === '') throw new Error(`Baris ${index + 1}: ID wajib diisi`);

        for (const field of statusFieldKeys) {
          const value = item[field];
          if (value === undefined || value === null || value === '') {
            throw new Error(`Baris ${index + 1}: ${field} harus diisi dengan 'OK' atau 'NG'`);
          }
          if (value !== 'OK' && value !== 'NG') {
            throw new Error(`Baris ${index + 1}: ${field} harus diisi dengan 'OK' atau 'NG'`);
          }
        }

        const hasNg = statusFields.some(f => item[f.key] === 'NG');
        if (hasNg) {
          if (!item.keterangan || item.keterangan.trim() === '') {
            throw new Error(`Baris ${index + 1}: Keterangan wajib diisi untuk item dengan status NG`);
          }
        }
      }

      const submitData = {
        date,
        area,
        checker: user?.fullName || "",
        checkerNik: user?.nik || "",
        items: items.map((item) => ({
          no: item.no,
          lokasi: item.lokasi,
          id: item.id,
          kondisiLampu: item.kondisiLampu,
          indicatorLamp: item.indicatorLamp,
          batteryCharger: item.batteryCharger,
          idNumber: item.idNumber,
          kebersihan: item.kebersihan,
          kondisiKabel: item.kondisiKabel,
          keterangan: item.keterangan || "",
          tindakanPerbaikan: item.tindakanPerbaikan || "",
          pic: item.pic,
          foto: item.foto || null
        }))
      };

      // ✅ PENGGUNAAN SMARTFETCH UNTUK OFFLINE MODE
      const response = await smartFetch('/e-checksheet-ga/api/emergency-lamp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(submitData),
        credentials: 'include',
        queueType: 'emergency_lamp',
        metadata: { areaCode: area }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Data berhasil disimpan!');
        router.push(`/status-ga/inspeksi-emergency/riwayat/${area}`);
      } else {
        throw new Error(result.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('❌ Gagal menyimpan data: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportNg = () => {
    const ngItems = items
      .filter(
        (item) =>
          item.kondisiLampu === "NG" ||
          item.indicatorLamp === "NG" ||
          item.batteryCharger === "NG" ||
          item.idNumber === "NG" ||
          item.kebersihan === "NG" ||
          item.kondisiKabel === "NG"
      )
      .map((item) => ({
        name: `${item.lokasi} (${item.id})`,
        notes: item.keterangan || "Tidak ada keterangan",
        foto: item.foto || undefined,
      }));

    const pelaporanData = {
      tanggal: date,
      mainType: "ga",
      subType: "inspector",
      checkPoint: `Inspeksi Emergency Lamp - ${area.toUpperCase()}`,
      shift: "A",
      ngNotes: "Temuan NG dari checklist Emergency Lamp",
      department: "General Affairs",
      reporter: user?.fullName || "",
      reportedAt: new Date().toISOString(),
      status: "open" as const,
      ngItemsDetail: ngItems,
    };

    localStorage.setItem("temp_ng_report", JSON.stringify(pelaporanData));
    router.push("/status-ga/pelaporan");
  };

  const getAreaTitle = () => {
    const titles: Record<string, string> = {
      "genba-a": "GENBA A",
      "genba-b": "GENBA B",
      "genba-c": "GENBA C",
      "jig-proto": "JIG PROTO",
      "gel-sheet": "GEL SHEET",
      "warehouse": "WAREHOUSE",
      "mezzanine": "MEZZANINE",
      "parkir": "PARKIR",
      "main-office": "MAIN OFFICE",
    };
    return titles[area] || area.toUpperCase();
  };

  const toggleExpandItem = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  if (!user) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        {/* Header Banner */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/inspeksi-emergency")}
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>
          <h1 className="page-title">💡 Inspeksi Emergency Lamp - {getAreaTitle()}</h1>
        </div>

        <p className="subtitle">
          📅{" "}
          <span className="date-text">
            {new Date(date).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </p>

        {/* ✅ SCAN WARNING BANNER - TAMBAHAN BARU */}
        {!isScanned && (
          <div className="banner banner-warning scan-warning">
            <span>🔒 Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.</span>
            <button 
              onClick={() => router.push("/scan")} 
              className="banner-btn"
              disabled={loading}
            >
              <QrCode size={14} /> Scan Sekarang
            </button>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Memproses...</p>
          </div>
        )}

        {!showPreview ? (
          <div className="card-container">
            {/* ✅ DESKTOP: Table View */}
            <div className="desktop-view">
              <table className="checklist-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Lokasi</th>
                    <th>ID</th>
                    {statusFields.map((field, idx) => (
                      <th key={idx}>{field.label}</th>
                    ))}
                    <th>Keterangan</th>
                    <th>Tindakan</th>
                    <th>PIC</th>
                    <th>Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="info-cell">{item.no}</td>
                      <td className="info-cell">{item.lokasi}</td>
                      <td className="info-cell">{item.id}</td>
                      {statusFields.map((field, idx) => (
                        <td key={idx}>
                          <select
                            value={item[field.key]}
                            onChange={(e) => handleInputChange(index, field.key, e.target.value)}
                            className="status-select"
                            disabled={loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          >
                            <option value="">Pilih</option>
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </td>
                      ))}
                      <td>
                        <input
                          type="text"
                          value={item.keterangan}
                          onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                          placeholder="Wajib jika NG"
                          className="notes-input"
                          disabled={loading || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.tindakanPerbaikan}
                          onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                          placeholder="Tindakan..."
                          className="notes-input"
                          disabled={loading || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </td>
                      <td>
                        <div className="info-cell">{item.pic}</div>
                      </td>
                      <td>
                        <div className="image-upload">
                          {items[index].foto ? (
                            <div className="image-preview">
                              <img
                                src={
                                  items[index].foto.startsWith('data:')
                                    ? items[index].foto
                                    : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${items[index].foto}`
                                }
                                alt="Preview"
                                className="uploaded-image"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="remove-btn"
                                disabled={loading || !isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className={`file-label ${!isScanned ? 'disabled' : ''}`}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                              📷 Unggah
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="file-input"
                                disabled={loading || !isScanned}
                              />
                            </label>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ MOBILE: Card View */}
            <div className="mobile-view">
              {items.map((item, index) => (
                <div key={index} className="checklist-card">
                  <div className="card-header" onClick={() => toggleExpandItem(index)}>
                    <div className="card-no">{item.no}</div>
                    <div className="card-info">
                      <div className="card-lokasi">{item.lokasi}</div>
                      <div className="card-id">ID: {item.id}</div>
                    </div>
                    <div className={`expand-icon ${expandedItem === index ? 'expanded' : ''}`}>
                      ▼
                    </div>
                  </div>

                  {expandedItem === index && (
                    <div className="card-body">
                      {statusFields.map((field) => (
                        <div key={field.key} className="form-group">
                          <label>{field.label}</label>
                          <select
                            value={item[field.key]}
                            onChange={(e) => handleInputChange(index, field.key, e.target.value)}
                            className="status-select"
                            disabled={loading || !isScanned}
                            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                          >
                            <option value="">Pilih</option>
                            <option value="OK">OK</option>
                            <option value="NG">NG</option>
                          </select>
                        </div>
                      ))}

                      <div className="form-group">
                        <label>Keterangan</label>
                        <input
                          type="text"
                          value={item.keterangan}
                          onChange={(e) => handleInputChange(index, "keterangan", e.target.value)}
                          placeholder="Wajib diisi jika NG"
                          className="notes-input"
                          disabled={loading || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </div>

                      <div className="form-group">
                        <label>Tindakan Perbaikan</label>
                        <input
                          type="text"
                          value={item.tindakanPerbaikan}
                          onChange={(e) => handleInputChange(index, "tindakanPerbaikan", e.target.value)}
                          placeholder="Tindakan perbaikan..."
                          className="notes-input"
                          disabled={loading || !isScanned}
                          title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                        />
                      </div>

                      <div className="form-group">
                        <label>PIC</label>
                        <div className="info-cell">{item.pic}</div>
                      </div>

                      <div className="form-group">
                        <label>Foto</label>
                        <div className="image-upload">
                          {items[index].foto ? (
                            <div className="image-preview">
                              <img
                                src={
                                  items[index].foto.startsWith('data:')
                                    ? items[index].foto
                                    : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${items[index].foto}`
                                }
                                alt="Preview"
                                className="uploaded-image"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="remove-btn"
                                disabled={loading || !isScanned}
                                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <label className={`file-label file-label-large ${!isScanned ? 'disabled' : ''}`}
                              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                              📷 Unggah Foto
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="file-input"
                                disabled={loading || !isScanned}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button
                onClick={() => router.push("/status-ga/inspeksi-emergency")}
                className="btn-cancel"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleShowPreview}
                className="btn-submit"
                disabled={loading || !isScanned}
                title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
              >
                👁️ Preview & Simpan
              </button>
            </div>
          </div>
        ) : (
          <div className="card-container preview-mode">
            <h2 className="preview-title">🔍 Preview Data</h2>

            {/* ✅ DESKTOP: Preview Table */}
            <div className="desktop-preview">
              <div className="table-wrapper-responsive">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Lokasi</th>
                      <th>ID</th>
                      <th>Status</th>
                      <th>Keterangan</th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const hasNgItem =
                        item.kondisiLampu === "NG" ||
                        item.indicatorLamp === "NG" ||
                        item.batteryCharger === "NG" ||
                        item.idNumber === "NG" ||
                        item.kebersihan === "NG" ||
                        item.kondisiKabel === "NG";
                      return (
                        <tr key={index} className={hasNgItem ? "row-ng" : ""}>
                          <td>{item.no}</td>
                          <td>{item.lokasi}</td>
                          <td>{item.id}</td>
                          <td className={hasNgItem ? "status-ng" : "status-ok"}>
                            {hasNgItem ? "NG" : "OK"}
                          </td>
                          <td>{item.keterangan || "-"}</td>
                          <td>
                            {item.foto ? (
                              <img
                                src={item.foto.startsWith('data:') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`}
                                alt="Foto"
                                className="preview-image"
                              />
                            ) : (
                              "–"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ✅ MOBILE: Preview Cards */}
            <div className="mobile-preview">
              {items.map((item, index) => {
                const hasNgItem =
                  item.kondisiLampu === "NG" ||
                  item.indicatorLamp === "NG" ||
                  item.batteryCharger === "NG" ||
                  item.idNumber === "NG" ||
                  item.kebersihan === "NG" ||
                  item.kondisiKabel === "NG";

                return (
                  <div key={index} className={`preview-card ${hasNgItem ? 'preview-card-ng' : ''}`}>
                    <div className="preview-card-header">
                      <span className="preview-card-no">#{item.no}</span>
                      <span className={`preview-card-status ${hasNgItem ? 'status-ng' : 'status-ok'}`}>
                        {hasNgItem ? 'NG' : 'OK'}
                      </span>
                    </div>
                    <div className="preview-card-body">
                      <div className="preview-row">
                        <span className="preview-label">Lokasi:</span>
                        <span className="preview-value">{item.lokasi}</span>
                      </div>
                      <div className="preview-row">
                        <span className="preview-label">ID:</span>
                        <span className="preview-value">{item.id}</span>
                      </div>
                      {item.keterangan && (
                        <div className="preview-row">
                          <span className="preview-label">Keterangan:</span>
                          <span className="preview-value">{item.keterangan}</span>
                        </div>
                      )}
                      {item.foto && (
                        <div className="preview-row">
                          <span className="preview-label">Foto:</span>
                          <img
                            src={item.foto.startsWith('data:') ? item.foto : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${item.foto}`}
                            alt="Foto"
                            className="preview-card-image"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="preview-actions">
              <button
                onClick={handleCancelPreview}
                className="cancel-btn"
                disabled={loading}
              >
                ← Kembali
              </button>
              {hasNg ? (
                <div className="ng-actions">
                  <button
                    onClick={handleReportNg}
                    className="report-btn"
                    disabled={loading || !isScanned}
                    title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                  >
                    📢 Laporkan NG
                  </button>
                  <button
                    onClick={handleSave}
                    className="save-btn"
                    disabled={loading || !isScanned}
                    title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                  >
                    💾 Simpan Tanpa Lapor
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSave}
                  className="save-btn"
                  disabled={loading || !isScanned}
                  title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                >
                  💾 Simpan Data
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
      `}</style>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background-color: #f7f9fc;
        }

        .page-content {
          flex: 1;
          max-width: 1600px;
          margin: 0 auto;
          padding: 24px;
          color: #1e293b;
          width: 100%;
        }

        /* Header Banner */
        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 16px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          min-height: 44px;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-back-text {
          display: inline;
        }

        .page-title {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          flex: 1;
          word-break: break-word;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.95);
          margin-top: 8px;
          margin-bottom: 24px;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .date-text {
          font-weight: 700;
          font-size: 1.1rem;
          color: #ffeb3b;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          background: rgba(0, 0, 0, 0.2);
          padding: 4px 12px;
          border-radius: 8px;
          letter-spacing: 0.3px;
        }

        /* Banners */
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

        .card-container {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 16px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          padding: 24px;
          color: white;
          position: relative;
        }

        .preview-mode {
          background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
        }

        /* Desktop View */
        .desktop-view,
        .desktop-preview {
          display: block;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-view,
        .mobile-preview {
          display: none;
        }

        .table-wrapper-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .checklist-table,
        .simple-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          color: #fff8f8;
          min-width: 1400px;
        }

        .checklist-table th,
        .checklist-table td,
        .simple-table th,
        .simple-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          white-space: nowrap;
        }

        .checklist-table th,
        .simple-table th {
          background: rgba(0, 0, 0, 0.15);
          font-weight: 600;
          position: sticky;
          top: 0;
          color: white;
          z-index: 10;
        }

        .status-select,
        .notes-input {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 6px;
          font-size: 0.9rem;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          min-height: 44px;
        }

        .status-select:focus,
        .notes-input:focus {
          outline: none;
          border-color: #4fc3f7;
          box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.3);
        }

        .status-select:disabled,
        .notes-input:disabled {
          background: rgba(255, 255, 255, 0.5);
          cursor: not-allowed;
        }

        .info-cell {
          background: rgba(255, 255, 255, 0.4);
          color: white;
          font-weight: 500;
        }

        /* Mobile Card Styles */
        .checklist-card,
        .preview-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .preview-card-ng {
          border-color: rgba(244, 67, 54, 0.5);
          background: rgba(244, 67, 54, 0.1);
        }

        .card-header,
        .preview-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.1);
          transition: background 0.2s;
          min-height: 44px;
        }

        .card-header:hover,
        .preview-card-header:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .card-no,
        .preview-card-no {
          width: 40px;
          height: 40px;
          background: #1976d2;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .preview-card-status {
          margin-left: auto;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .preview-card-status.ok {
          background: rgba(76, 175, 80, 0.3);
          color: #c8e6c9;
        }

        .preview-card-status.ng {
          background: rgba(244, 67, 54, 0.3);
          color: #ffcdd2;
        }

        .card-info {
          flex: 1;
          min-width: 0;
        }

        .card-lokasi {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          word-break: break-word;
          margin-bottom: 4px;
        }

        .card-id {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .expand-icon {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          transition: transform 0.3s ease;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .card-body,
        .preview-card-body {
          padding: 16px;
          background: rgba(0, 0, 0, 0.1);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          gap: 12px;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          min-width: 80px;
          flex-shrink: 0;
        }

        .preview-value {
          font-size: 0.9rem;
          color: white;
          word-break: break-word;
          text-align: right;
          flex: 1;
        }

        .preview-card-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid white;
          cursor: pointer;
        }

        .image-upload {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 44px;
        }

        .file-label {
          display: inline-block;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .file-label.disabled {
          background: rgba(255,255,255,0.5);
          cursor: not-allowed;
          color: #666;
        }

        .file-label-large {
          width: 100%;
          padding: 12px 16px;
        }

        .file-label:hover {
          background: rgba(255, 255, 255, 1);
        }

        .file-input {
          display: none;
        }

        .image-preview {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .uploaded-image,
        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
          border: 2px solid white;
        }

        .preview-image {
          max-width: 80px;
          max-height: 80px;
        }

        .remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #f44336;
          color: white;
          border: 2px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.2s;
          min-height: 24px;
          min-width: 24px;
        }

        .remove-btn:hover {
          background: #d32f2f;
          transform: scale(1.1);
        }

        .remove-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .form-actions,
        .preview-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .btn-cancel,
        .btn-submit,
        .cancel-btn,
        .save-btn,
        .report-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          min-height: 48px;
          min-width: 120px;
        }

        .btn-cancel,
        .cancel-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .btn-cancel:hover,
        .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .btn-cancel:disabled,
        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-submit {
          background: #4caf50;
          color: white;
        }

        .btn-submit:hover {
          background: #43a047;
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-btn {
          background: #2e7d32;
          color: white;
        }

        .save-btn:hover {
          background: #1b5e20;
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .report-btn {
          background: #d32f2f;
          color: white;
        }

        .report-btn:hover {
          background: #b71c1c;
        }

        .report-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .preview-title {
          margin: 0 0 24px;
          color: white;
          font-size: 1.5rem;
          text-align: center;
          font-weight: 700;
        }

        .status-ng {
          background: rgba(244, 67, 54, 0.3);
          color: #ffcdd2;
          font-weight: bold;
          border-radius: 4px;
          padding: 4px 8px;
        }

        .status-ok {
          background: rgba(76, 175, 80, 0.3);
          color: #c8e6c9;
          font-weight: bold;
          border-radius: 4px;
          padding: 4px 8px;
        }

        .row-ng {
          background: rgba(244, 67, 54, 0.1);
        }

        .ng-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Loading Overlay */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          color: white;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 6px solid rgba(255, 255, 255, 0.3);
          border-top-color: #4caf50;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ✅ TABLET RESPONSIVE */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          .page-title {
            font-size: 1.2rem;
          }

          .checklist-table,
          .simple-table {
            min-width: 1200px;
            font-size: 0.85rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 10px 8px;
          }
        }

        /* ✅ MOBILE RESPONSIVE */
        @media (max-width: 768px) {
          .page-content {
            padding: 16px 12px;
            margin-left: 0;
          }

          .header-banner {
            padding: 12px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .btn-back {
            width: 100%;
            justify-content: center;
          }

          .btn-back-text {
            display: inline;
          }

          .page-title {
            font-size: 1.1rem;
            width: 100%;
            text-align: center;
          }

          .subtitle {
            font-size: 0.9rem;
            width: 100%;
          }

          .date-text {
            font-size: 1rem;
            width: 100%;
            text-align: center;
          }

          .card-container {
            padding: 16px 12px;
          }

          /* Hide desktop table, show mobile cards */
          .desktop-view,
          .desktop-preview {
            display: none;
          }

          .mobile-view,
          .mobile-preview {
            display: block;
          }

          .form-actions,
          .preview-actions,
          .ng-actions {
            flex-direction: column;
            gap: 12px;
          }

          .btn-cancel,
          .btn-submit,
          .cancel-btn,
          .save-btn,
          .report-btn {
            width: 100%;
            min-height: 52px;
            font-size: 1rem;
          }

          .checklist-table,
          .simple-table {
            min-width: 900px;
            font-size: 0.8rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 8px 6px;
          }

          .status-select,
          .notes-input {
            font-size: 0.9rem;
            min-height: 44px;
          }

          .image-preview {
            width: 70px;
            height: 70px;
          }

          .preview-image {
            max-width: 70px;
            max-height: 70px;
          }

          .card-no,
          .preview-card-no {
            width: 36px;
            height: 36px;
            font-size: 1rem;
          }

          .card-lokasi {
            font-size: 0.95rem;
          }

          .preview-label {
            min-width: 70px;
            font-size: 0.8rem;
          }

          .preview-value {
            font-size: 0.85rem;
          }

          .preview-card-image {
            width: 50px;
            height: 50px;
          }
        }

        /* ✅ SMALL MOBILE */
        @media (max-width: 480px) {
          .page-content {
            padding: 12px 8px;
          }

          .header-banner {
            padding: 10px 12px;
          }

          .page-title {
            font-size: 1rem;
          }

          .subtitle {
            font-size: 0.85rem;
          }

          .date-text {
            font-size: 0.9rem;
            padding: 3px 8px;
          }

          .card-container {
            padding: 12px 8px;
          }

          .card-header,
          .preview-card-header {
            padding: 12px;
          }

          .card-no,
          .preview-card-no {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }

          .card-body,
          .preview-card-body {
            padding: 12px;
          }

          .form-group label {
            font-size: 0.85rem;
          }

          .status-select,
          .notes-input {
            font-size: 0.85rem;
            min-height: 44px;
          }

          .file-label {
            padding: 10px 14px;
            font-size: 0.85rem;
            min-height: 44px;
          }

          .file-label-large {
            padding: 12px 14px;
          }

          .image-preview {
            width: 60px;
            height: 60px;
          }

          .preview-image {
            max-width: 60px;
            max-height: 60px;
          }

          .btn-cancel,
          .btn-submit,
          .cancel-btn,
          .save-btn,
          .report-btn {
            min-height: 56px;
            font-size: 0.95rem;
            padding: 14px 20px;
          }

          .checklist-table,
          .simple-table {
            min-width: 700px;
            font-size: 0.75rem;
          }

          .checklist-table th,
          .checklist-table td,
          .simple-table th,
          .simple-table td {
            padding: 6px 4px;
          }

          .preview-title {
            font-size: 1.3rem;
          }

          .preview-label {
            min-width: 60px;
            font-size: 0.75rem;
          }

          .preview-value {
            font-size: 0.8rem;
          }

          .preview-card-image {
            width: 45px;
            height: 45px;
          }
        }
      `}</style>
    </div>
  );
}