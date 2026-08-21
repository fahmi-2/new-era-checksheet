// app/status-ga/fire-alarm/[zona]/page.tsx
"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, QrCode } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────
interface FireAlarmItem {
  no: number;
  zona: string;
  lokasi: string;
  alarmBell: string;
  indicatorLamp: string;
  manualCallPoint: string;
  idZona: string;
  kebersihan: string;
  kondisiNok: string;
  tindakanPerbaikan: string;
  pic: string;
  foto: string | null;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function makeEmptyItem(no: number, zona: string, defaultPic = ""): FireAlarmItem {
  return {
    no, zona, lokasi: "",
    alarmBell: "OK", indicatorLamp: "OK", manualCallPoint: "OK",
    idZona: "", kebersihan: "OK",
    kondisiNok: "", tindakanPerbaikan: "",
    pic: defaultPic, foto: null,
  };
}

function deduplicateAndReorder(rawItems: FireAlarmItem[]): FireAlarmItem[] {
  return rawItems.map((item, idx) => ({ ...item, no: idx + 1 }));
}

function hasNGItem(item: FireAlarmItem): boolean {
  return ["alarmBell", "indicatorLamp", "manualCallPoint", "idZona", "kebersihan"]
    .some((f) => (item as any)[f] === "NG");
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function ChecksheetFireAlarm({
  params,
}: {
  params: Promise<{ zona: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, pendingCount } = useConnection();
  const { zona } = use(params);

  const today = new Date();
  const date = today.toISOString().split("T")[0];

  // State
  const [items, setItems] = useState<FireAlarmItem[]>([]);
  const [checker, setChecker] = useState("");
  const [checkerNik, setCheckerNik] = useState("");

  const [masterLoading, setMasterLoading] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [masterInfo, setMasterInfo] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasNg, setHasNg] = useState(false);
  const [redirected, setRedirected] = useState(false);

  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [scanVerified, setScanVerified] = useState(false);
  const [scanWarning, setScanWarning] = useState<string | null>(null);

  // ─── AUTH ──────────────────────────────────────────────────
  useEffect(() => {
    if (redirected) return;
    if (!user || !isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
    } else {
      setChecker(user.fullName || "");
      setCheckerNik(user.nik || "");
    }
  }, [user, router, redirected]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isScanned = params.get("_scanned") === "true";
      if (isScanned) {
        setScanVerified(true);
        setScanWarning(null);
      } else {
        setScanVerified(false);
        setScanWarning("Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.");
      }
    }
  }, []);

  // ─── LOAD MASTER ───────────────────────────────────────────
  const loadMasterData = useCallback(async () => {
    if (!zona) return;
    setMasterLoading(true);
    setMasterError(null);
    setMasterInfo(null);
    try {
      const url = `/e-checksheet-ga/api/fire-alarm/master?zona=${encodeURIComponent(zona)}&_t=${Date.now()}`;
      const res = await smartFetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache" },
        queueType: 'fire_alarm',
        metadata: { areaCode: zona }
      });
      if (!res.ok) throw new Error(`Server error ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Gagal memuat data master");

      if (json.data && json.data.length > 0) {
        const uniqueItems = deduplicateAndReorder(json.data);
        setItems(uniqueItems);
        if (json.lastSubmittedAt) {
          const tgl = new Date(json.lastSubmittedAt).toLocaleDateString("id-ID", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          });
          setMasterInfo(`✅ Template dimuat: ${uniqueItems.length} lokasi dari pemeriksaan terakhir (${tgl}).`);
        } else {
          setMasterInfo(`✅ Template dimuat: ${uniqueItems.length} lokasi dari pemeriksaan terakhir.`);
        }
      } else {
        setItems([makeEmptyItem(1, zona, user?.fullName || "")]);
        setMasterInfo("ℹ️ Belum ada data sebelumnya. Silakan isi form dari awal.");
      }
    } catch (err: any) {
      console.error("loadMasterData error:", err);
      setMasterError(`⚠️ ${err.message || "Gagal memuat template"}. Form dimulai kosong.`);
      setItems([makeEmptyItem(1, zona, user?.fullName || "")]);
    } finally {
      setMasterLoading(false);
    }
  }, [zona, user]);

  useEffect(() => {
    if (zona && user) loadMasterData();
  }, [zona, user, loadMasterData]);

  // ─── ITEM HANDLERS ─────────────────────────────────────────
  const updateItem = (index: number, field: keyof FireAlarmItem, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddItem = () => {
    const maxNo = Math.max(0, ...items.map((i) => i.no || 0));
    setItems((prev) => [...prev, makeEmptyItem(maxNo + 1, zona, checker)]);
    setExpandedItem(items.length);
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) { alert("⚠️ Minimal harus ada 1 item dalam daftar!"); return; }
    if (confirm("Apakah Anda yakin ingin menghapus item ini?")) {
      setItems((prev) =>
        prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: i + 1 }))
      );
    }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      alert("Format file tidak didukung. Gunakan JPEG, PNG, atau WEBP"); return;
    }
    if (file.size > 5 * 1024 * 1024) { alert("Ukuran file terlalu besar. Maksimal 5MB"); return; }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("zona", zona);
      formData.append("lokasi", items[index].lokasi);
      const response = await fetch("/e-checksheet-ga/api/fire-alarm/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (response.ok && result.success) {
        updateItem(index, "foto", result.data.path);
        alert("✅ Foto berhasil diupload!");
      } else {
        alert("❌ Gagal upload foto: " + (result.message || "Error tidak diketahui"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Terjadi kesalahan saat upload foto");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleRemoveFoto = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], foto: null };
      return updated;
    });
  };

  // ─── VALIDATION ────────────────────────────────────────────
  const handleShowPreview = () => {
    for (const item of items) {
      if (!item.lokasi || item.lokasi.trim() === "") {
        alert(`⚠️ Lokasi wajib diisi untuk semua item!`); return;
      }
    }
    const ngExists = items.some(hasNGItem);
    if (ngExists) {
      const missingKet = items.some(
        (item) => hasNGItem(item) && (!item.kondisiNok || item.kondisiNok.trim() === "")
      );
      if (missingKet) { alert("⚠️ Harap isi 'Kondisi N-OK' untuk semua item yang berstatus NG!"); return; }
      const missingTindakan = items.some(
        (item) => hasNGItem(item) && (!item.tindakanPerbaikan || item.tindakanPerbaikan.trim() === "")
      );
      if (missingTindakan) { alert("⚠️ Harap isi 'Tindakan Perbaikan' untuk semua item yang berstatus NG!"); return; }
    }
    setHasNg(ngExists);
    setShowPreview(true);
  };

  // ─── SUBMIT ────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        date,
        zona,
        checker: checker.trim(),
        checkerNik: checkerNik.trim(),
        items: items.map((item, idx) => ({ ...item, no: idx + 1 })),
      };
      const res = await fetch("/e-checksheet-ga/api/fire-alarm/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert("✅ Data berhasil disimpan!");
        router.push(`/status-ga/fire-alarm/riwayat/${zona}`);
      } else {
        throw new Error(result.message || "Gagal menyimpan data");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      alert("❌ Gagal menyimpan data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandItem = (index: number) =>
    setExpandedItem(expandedItem === index ? null : index);

  if (!user) return null;

  const statusFields = [
    { key: "alarmBell", label: "Alarm Bell" },
    { key: "indicatorLamp", label: "Indicator Lamp" },
    { key: "manualCallPoint", label: "Manual Call Point" },
    { key: "kebersihan", label: "Kebersihan" },
  ] as const;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />
      <div className="page-content">

        {/* ── Header Banner ─────────────────────────────── */}
        <div className="header-banner">
          <button
            onClick={() => router.push("/status-ga/fire-alarm")}
            className="btn-back"
          >
            <ArrowLeft size={18} />
            <span className="btn-back-text">Kembali</span>
          </button>

          {/* <Link href="/scan" className="btn-scan-qr">
            <QrCode size={18} />
            <span>Scan QR Area</span>
          </Link> */}

          <h1 className="page-title">
            Inspeksi Fire Alarm -{" "}
            {zona?.toUpperCase()}
          </h1>
        </div>

        {/* ── Tanggal ───────────────────────────────────── */}
        <p className="subtitle">
          📅{" "}
          <span className="date-text">
            {new Date(date).toLocaleDateString("id-ID", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </span>
        </p>

        {/* ── Checker Input ─────────────────────────────── */}
        <div className="checker-card">
          <div className="checker-field">
            <label className="field-label">
              Nama Checker <span className="required-star">*</span>
            </label>
            <input
              type="text"
              value={checker}
              onChange={(e) => setChecker(e.target.value)}
              placeholder="Nama pemeriksa..."
              className="field-input"
              disabled={loading}
            />
          </div>
          <div className="checker-field">
            <label className="field-label">NIK</label>
            <input
              type="text"
              value={checkerNik}
              onChange={(e) => setCheckerNik(e.target.value)}
              placeholder="NIK (opsional)..."
              className="field-input"
              disabled={loading}
            />
          </div>
        </div>

        {!scanVerified && (
          <div className="banner banner-warning scan-warning">
            <span>{scanWarning}</span>
            <button
              onClick={() => router.push("/scan")}
              className="banner-btn"
              disabled={loading}
            >
              <QrCode size={14} /> Scan Sekarang
            </button>
          </div>
        )}

        {/* ── Master Status Banners ──────────────────────── */}
        {masterLoading && (
          <div className="banner banner-loading">
            <span className="spinner-inline">⏳</span>
            <span>Memuat template dari data pemeriksaan terakhir...</span>
          </div>
        )}
        {masterError && (
          <div className="banner banner-warning">
            <span>{masterError}</span>
            <button onClick={loadMasterData} className="banner-btn" disabled={loading}>
              🔄 Coba Lagi
            </button>
          </div>
        )}
        {!masterLoading && masterInfo && (
          <div className="banner banner-success">{masterInfo}</div>
        )}

        {/* ── Loading Overlay ────────────────────────────── */}
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Memproses...</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            FORM / PREVIEW TOGGLE
        ══════════════════════════════════════════════════ */}
        {!showPreview ? (
          <div className="card-container">

            {/* ── DESKTOP: Table View ───────────────────── */}
            <div className="desktop-view">
              <div className="table-scroll-wrapper">
                <table className="checklist-table">
                  <thead>
                    <tr>
                      <th className="th-center">Hapus</th>
                      <th className="th-center sticky-col">No</th>
                      <th>Zona</th>
                      <th>Lokasi</th>
                      <th>Alarm Bell</th>
                      <th>Indicator Lamp</th>
                      <th>Manual Call Point</th>
                      <th>ID Zona</th>
                      <th>Kebersihan</th>
                      <th>Kondisi N-OK</th>
                      <th>Tindakan Perbaikan</th>
                      <th>PIC</th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const isNG = hasNGItem(item);
                      return (
                        <tr key={`item-${item.no}-${item.lokasi}-${index}`}
                          className={isNG ? "row-ng" : ""}>

                          {/* Hapus */}
                          <td className="delete-col">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(index)}
                              className="delete-btn"
                              disabled={loading}
                              title="Hapus item"
                            >✕</button>
                          </td>

                          {/* No */}
                          <td className="sticky-col td-center">{item.no}</td>

                          {/* Zona */}
                          <td>
                            <div className="info-cell">{item.zona}</div>
                          </td>

                          {/* Lokasi */}
                          <td>
                            <input
                              type="text"
                              value={item.lokasi}
                              onChange={(e) => updateItem(index, "lokasi", e.target.value)}
                              className={`notes-input ${!item.lokasi ? "input-error" : ""}`}
                              disabled={loading || !scanVerified}
                              placeholder="Lokasi..."
                            />
                          </td>

                          {/* Alarm Bell */}
                          <td>
                            <select
                              value={item.alarmBell}
                              onChange={(e) => updateItem(index, "alarmBell", e.target.value)}
                              className={`status-select ${item.alarmBell === "NG" ? "select-ng" : "select-ok"}`}
                              disabled={loading || !scanVerified}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                            </select>
                          </td>

                          {/* Indicator Lamp */}
                          <td>
                            <select
                              value={item.indicatorLamp}
                              onChange={(e) => updateItem(index, "indicatorLamp", e.target.value)}
                              className={`status-select ${item.indicatorLamp === "NG" ? "select-ng" : "select-ok"}`}
                              disabled={loading || !scanVerified}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                            </select>
                          </td>

                          {/* Manual Call Point */}
                          <td>
                            <select
                              value={item.manualCallPoint}
                              onChange={(e) => updateItem(index, "manualCallPoint", e.target.value)}
                              className={`status-select ${item.manualCallPoint === "NG" ? "select-ng" : "select-ok"}`}
                              disabled={loading || !scanVerified}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                            </select>
                          </td>

                          {/* ID Zona - ✅ UBAH DARI INPUT MENJADI SELECT */}
<td>
  <select
    value={item.idZona || "OK"}
    onChange={(e) => updateItem(index, "idZona", e.target.value)}
    className={`status-select ${item.idZona === "NG" ? "select-ng" : "select-ok"}`}
    disabled={loading || !scanVerified}
  >
    <option value="OK">OK</option>
    <option value="NG">NG</option>
    <option value="OBS">OBS</option>
  </select>
</td>

                          {/* Kebersihan */}
                          <td>
                            <select
                              value={item.kebersihan}
                              onChange={(e) => updateItem(index, "kebersihan", e.target.value)}
                              className={`status-select ${item.kebersihan === "NG" ? "select-ng" : "select-ok"}`}
                              disabled={loading || !scanVerified}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                            </select>
                          </td>

                          {/* Kondisi N-OK */}
                          <td>
                            <input
                              type="text"
                              value={item.kondisiNok}
                              onChange={(e) => updateItem(index, "kondisiNok", e.target.value)}
                              placeholder={isNG ? "Wajib jika NG" : "Catatan..."}
                              className={`notes-input ${isNG && !item.kondisiNok ? "input-error" : ""}`}
                              disabled={loading || !scanVerified}
                            />
                          </td>

                          {/* Tindakan Perbaikan */}
                          <td>
                            <input
                              type="text"
                              value={item.tindakanPerbaikan}
                              onChange={(e) => updateItem(index, "tindakanPerbaikan", e.target.value)}
                              placeholder={isNG ? "Wajib jika NG" : "Tindakan..."}
                              className={`notes-input ${isNG && !item.tindakanPerbaikan ? "input-error" : ""}`}
                              disabled={loading || !scanVerified}
                            />
                          </td>

                          {/* PIC */}
                          <td>
                            <input
                              type="text"
                              value={item.pic}
                              onChange={(e) => updateItem(index, "pic", e.target.value)}
                              className="notes-input"
                              disabled={loading || !scanVerified}
                              placeholder="PIC..."
                            />
                          </td>

                          {/* Alarm Bell */}
                          <td>
                            <select
                              value={item.alarmBell}
                              onChange={(e) => updateItem(index, "alarmBell", e.target.value)}
                              className={`status-select ${item.alarmBell === "NG" ? "select-ng" : "select-ok"}`}
                              disabled={loading}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                            </select>
                          </td>

                          {/* Indicator Lamp */}
                          <td>
                            <select
                              value={item.indicatorLamp}
                              onChange={(e) => updateItem(index, "indicatorLamp", e.target.value)}
                              className={`status-select ${item.indicatorLamp === "NG" ? "select-ng" : "select-ok"}`}
                              disabled={loading}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                            </select>
                          </td>

                          {/* Manual Call Point */}
                          <td>
                            <select
                              value={item.manualCallPoint}
                              onChange={(e) => updateItem(index, "manualCallPoint", e.target.value)}
                              className={`status-select ${item.manualCallPoint === "NG" ? "select-ng" : "select-ok"}`}
                              disabled={loading}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                            </select>
                          </td>

                          {/* ID Zona */}
                          {/* ID Zona - ✅ UBAH DARI INPUT MENJADI SELECT */}
<td>
  <select
    value={item.idZona || "OK"}
    onChange={(e) => updateItem(index, "idZona", e.target.value)}
    className={`status-select ${item.idZona === "NG" ? "select-ng" : "select-ok"}`}
    disabled={loading}
  >
    <option value="OK">OK</option>
    <option value="NG">NG</option>
    <option value="OBS">OBS</option>
  </select>
</td>

                          {/* Kebersihan */}
                          <td>
                            <select
                              value={item.kebersihan}
                              onChange={(e) => updateItem(index, "kebersihan", e.target.value)}
                              className={`status-select ${item.kebersihan === "NG" ? "select-ng" : "select-ok"}`}
                              disabled={loading}
                            >
                              <option value="OK">OK</option>
                              <option value="NG">NG</option>
                            </select>
                          </td>

                          {/* Kondisi N-OK */}
                          <td>
                            <input
                              type="text"
                              value={item.kondisiNok}
                              onChange={(e) => updateItem(index, "kondisiNok", e.target.value)}
                              placeholder={isNG ? "Wajib jika NG" : "Catatan..."}
                              className={`notes-input ${isNG && !item.kondisiNok ? "input-error" : ""}`}
                              disabled={loading}
                            />
                          </td>

                          {/* Tindakan Perbaikan */}
                          <td>
                            <input
                              type="text"
                              value={item.tindakanPerbaikan}
                              onChange={(e) => updateItem(index, "tindakanPerbaikan", e.target.value)}
                              placeholder={isNG ? "Wajib jika NG" : "Tindakan..."}
                              className={`notes-input ${isNG && !item.tindakanPerbaikan ? "input-error" : ""}`}
                              disabled={loading}
                            />
                          </td>

                          {/* PIC */}
                          <td>
                            <input
                              type="text"
                              value={item.pic}
                              onChange={(e) => updateItem(index, "pic", e.target.value)}
                              className="notes-input"
                              disabled={loading}
                              placeholder="PIC..."
                            />
                          </td>

                          {/* Foto */}
                          <td>
                            <div className="image-upload">
                              {item.foto ? (
                                <div className="image-preview">
                                  <img
                                    src={item.foto.startsWith("data:")
                                      ? item.foto
                                      : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${item.foto}`}
                                    alt="Preview"
                                    className="uploaded-image"
                                    onClick={() => setPreviewImage(
                                      item.foto!.startsWith("data:")
                                        ? item.foto!
                                        : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${item.foto}`
                                    )}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFoto(index)}
                                    className="remove-btn"
                                    disabled={loading}
                                  >✕</button>
                                </div>
                              ) : (
                                <label className="file-label">
                                  📷 Unggah
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFotoUpload(e, index)}
                                    className="file-input"
                                    disabled={loading}
                                  />
                                </label>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── MOBILE: Card View ─────────────────────── */}
            <div className="mobile-view">
              {items.map((item, index) => {
                const isNG = hasNGItem(item);
                return (
                  <div key={`card-${item.no}-${index}`} className="checklist-card">
                    <div className="card-header" onClick={() => toggleExpandItem(index)}>
                      <div className="card-no">{item.no}</div>
                      <div className="card-info">
                        <div className="card-zona">{item.zona}</div>
                        <div className="card-lokasi">{item.lokasi || "—"}</div>
                      </div>
                      {isNG && <span className="card-ng-badge">NG</span>}
                      <div className={`expand-icon ${expandedItem === index ? "expanded" : ""}`}>▼</div>
                    </div>

                    {expandedItem === index && (
                      <div className="card-body">
                        {/* Lokasi */}
                        <div className="form-group">
                          <label>Lokasi <span className="required-star">*</span></label>
                          <input
                            type="text"
                            value={item.lokasi}
                            onChange={(e) => updateItem(index, "lokasi", e.target.value)}
                            className={`notes-input ${!item.lokasi ? "input-error" : ""}`}
                            disabled={loading || !scanVerified}
                            placeholder="Lokasi..."
                          />
                        </div>

                        {/* ID Zona - ✅ UBAH DARI INPUT MENJADI SELECT */}
<div className="form-group">
  <label>ID Zona</label>
  <select
    value={item.idZona || "OK"}
    onChange={(e) => updateItem(index, "idZona", e.target.value)}
    className={`status-select ${item.idZona === "NG" ? "select-ng" : "select-ok"}`}
    disabled={loading || !scanVerified}
  >
    <option value="OK">OK</option>
    <option value="NG">NG</option>
    <option value="OBS">OBS</option>
  </select>
</div>

                        {/* Status checks */}
                        <div className="checklist-section">
                          <h4 className="section-title">✅ Status Pengecekan</h4>
                          {statusFields.map(({ key, label }) => (
                            <div key={key} className="check-row">
                              <label className="check-label">{label}</label>
                              <select
                                value={(item as any)[key]}
                                onChange={(e) => updateItem(index, key as keyof FireAlarmItem, e.target.value)}
                                className={`check-select ${(item as any)[key] === "NG" ? "select-ng" : "select-ok"}`}
                                disabled={loading || !scanVerified}
                              >
                                <option value="OK">OK</option>
                                <option value="NG">NG</option>
                              </select>
                            </div>
                          ))}
                        </div>

                        {/* Kondisi N-OK */}
                        <div className="form-group">
                          <label>
                            Kondisi N-OK{" "}
                            {isNG && <span className="required-star">*</span>}
                          </label>
                          <input
                            type="text"
                            value={item.kondisiNok}
                            onChange={(e) => updateItem(index, "kondisiNok", e.target.value)}
                            placeholder={isNG ? "Wajib diisi jika NG" : "Catatan kondisi..."}
                            className={`notes-input ${isNG && !item.kondisiNok ? "input-error" : ""}`}
                            disabled={loading || !scanVerified}
                          />
                        </div>

                        {/* Tindakan Perbaikan */}
                        <div className="form-group">
                          <label>
                            Tindakan Perbaikan{" "}
                            {isNG && <span className="required-star">*</span>}
                          </label>
                          <input
                            type="text"
                            value={item.tindakanPerbaikan}
                            onChange={(e) => updateItem(index, "tindakanPerbaikan", e.target.value)}
                            placeholder={isNG ? "Wajib diisi jika NG" : "Tindakan perbaikan..."}
                            className={`notes-input ${isNG && !item.tindakanPerbaikan ? "input-error" : ""}`}
                            disabled={loading || !scanVerified}
                          />
                        </div>

                        {/* PIC */}
                        <div className="form-group">
                          <label>PIC</label>
                          <input
                            type="text"
                            value={item.pic}
                            onChange={(e) => updateItem(index, "pic", e.target.value)}
                            className="notes-input"
                            disabled={loading || !scanVerified}
                            placeholder="PIC..."
                          />
                        </div>

                        {/* Foto */}
                        <div className="form-group">
                          <label>Foto</label>
                          <div className="image-upload">
                            {item.foto ? (
                              <div className="image-preview">
                                <img
                                  src={item.foto.startsWith("data:")
                                    ? item.foto
                                    : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${item.foto}`}
                                  alt="Preview"
                                  className="uploaded-image"
                                  onClick={() => setPreviewImage(
                                    item.foto!.startsWith("data:")
                                      ? item.foto!
                                      : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${item.foto}`
                                  )}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFoto(index)}
                                  className="remove-btn"
                                  disabled={loading}
                                >✕</button>
                              </div>
                            ) : (
                              <label className="file-label file-label-large">
                                📷 Unggah Foto
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFotoUpload(e, index)}
                                  className="file-input"
                                  disabled={loading}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Hapus item */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="btn-delete-mobile"
                          disabled={loading}
                        >
                          🗑️ Hapus Item Ini
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Form Actions ──────────────────────────── */}
            <div className="form-actions">
              <button onClick={handleAddItem} className="btn-add-item" disabled={loading || !scanVerified} title={!scanVerified ? "Harap scan QR code terlebih dahulu" : ""}>
                ➕ Tambah Item
              </button>
              <button
                onClick={() => router.push("/status-ga/fire-alarm")}
                className="btn-cancel"
                disabled={loading}
              >
                Batal
              </button>
              <button onClick={handleShowPreview} className="btn-submit" disabled={loading || !scanVerified} title={!scanVerified ? "Harap scan QR code terlebih dahulu" : ""}>
                👁️ Preview & Simpan
              </button>
            </div>
          </div>

        ) : (
          /* ══ PREVIEW MODE ═══════════════════════════════ */
          <div className="card-container preview-mode">
            <h2 className="preview-title">🔍 Preview Data</h2>

            {/* Summary */}
            <div className="preview-summary">
              <div className="summary-item">
                <span className="summary-label">Tanggal</span>
                <span className="summary-value">
                  {new Date(date).toLocaleDateString("id-ID", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Zona</span>
                <span className="summary-value">{zona?.toUpperCase()}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Checker</span>
                <span className="summary-value">{checker}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Item</span>
                <span className="summary-value">{items.length} item</span>
              </div>
              {hasNg && (
                <div className="summary-item">
                  <span className="summary-label">Item NG</span>
                  <span className="summary-value summary-ng">
                    {items.filter(hasNGItem).length} item NG
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Preview Table */}
            <div className="desktop-view">
              <div className="table-scroll-wrapper">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th className="sticky-col">No</th>
                      <th>Zona</th>
                      <th>Lokasi</th>
                      <th>Status</th>
                      <th>Kondisi N-OK</th>
                      <th>Tindakan</th>
                      <th>PIC</th>
                      <th>Foto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const isNG = hasNGItem(item);
                      return (
                        <tr key={index} className={isNG ? "row-ng" : ""}>
                          <td className="sticky-col td-center">{item.no}</td>
                          <td>{item.zona}</td>
                          <td>{item.lokasi}</td>
                          <td>
                            <span className={isNG ? "status-ng" : "status-ok"}>
                              {isNG ? "NG" : "OK"}
                            </span>
                          </td>
                          <td>{item.kondisiNok || "—"}</td>
                          <td>{item.tindakanPerbaikan || "—"}</td>
                          <td>{item.pic || "—"}</td>
                          <td>
                            {item.foto ? (
                              <img
                                src={item.foto.startsWith("data:")
                                  ? item.foto
                                  : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${item.foto}`}
                                alt="Foto"
                                className="preview-image"
                                onClick={() => setPreviewImage(
                                  item.foto!.startsWith("data:")
                                    ? item.foto!
                                    : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${item.foto}`
                                )}
                              />
                            ) : "–"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Preview Cards */}
            <div className="mobile-view">
              {items.map((item, index) => {
                const isNG = hasNGItem(item);
                return (
                  <div key={index} className={`preview-card ${isNG ? "preview-card-ng" : ""}`}>
                    <div className="preview-card-header">
                      <span className="preview-card-no">#{item.no}</span>
                      <span className="preview-card-lokasi">{item.lokasi}</span>
                      <span className={`preview-card-status ${isNG ? "status-ng" : "status-ok"}`}>
                        {isNG ? "NG" : "OK"}
                      </span>
                    </div>
                    <div className="preview-card-body">
                      <div className="preview-row">
                        <span className="preview-label">Zona:</span>
                        <span className="preview-value">{item.zona}</span>
                      </div>
                      {item.kondisiNok && (
                        <div className="preview-row">
                          <span className="preview-label">Kondisi N-OK:</span>
                          <span className="preview-value">{item.kondisiNok}</span>
                        </div>
                      )}
                      {item.tindakanPerbaikan && (
                        <div className="preview-row">
                          <span className="preview-label">Tindakan:</span>
                          <span className="preview-value">{item.tindakanPerbaikan}</span>
                        </div>
                      )}
                      <div className="preview-row">
                        <span className="preview-label">PIC:</span>
                        <span className="preview-value">{item.pic || "—"}</span>
                      </div>
                      {item.foto && (
                        <div className="preview-row">
                          <span className="preview-label">Foto:</span>
                          <img
                            src={item.foto.startsWith("data:")
                              ? item.foto
                              : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${item.foto}`}
                            alt="Foto"
                            className="preview-card-image"
                            onClick={() => setPreviewImage(
                              item.foto!.startsWith("data:")
                                ? item.foto!
                                : `${process.env.NEXT_PUBLIC_BASE_URL || ""}${item.foto}`
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Preview Actions */}
            <div className="preview-actions">
              <button onClick={() => setShowPreview(false)} className="cancel-btn" disabled={loading}>
                ← Kembali Edit
              </button>
              <button onClick={handleSave} className="save-btn" disabled={loading}>
                {loading ? "💾 Menyimpan..." : "💾 Simpan Data"}
              </button>
            </div>
          </div>
        )}

        {/* ── Image Preview Modal ───────────────────────── */}
        {previewImage && (
          <div className="image-modal" onClick={() => setPreviewImage(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setPreviewImage(null)}>✕</button>
              <img src={previewImage} alt="Zoom" className="modal-image" />
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════
          GLOBAL STYLES
      ══════════════════════════════════════════════════ */}
      <style jsx global>{`
        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, sans-serif;
          margin: 0; padding: 0; background-color: #f8fafc;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <style jsx>{`
        /* ── Layout ─────────────────────────────────────── */
        .app-page {
          display: flex; min-height: 100vh; background-color: #f7f9fc;
        }
        .page-content {
          flex: 1; max-width: 1400px; margin: 0 auto; padding: 24px; width: 100%;
        }

        /* ── Header Banner ──────────────────────────────── */
        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white; padding: 16px 24px; border-radius: 16px;
          margin-bottom: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .btn-back {
          display: flex; align-items: center; gap: 8px; padding: 8px 16px;
          background: rgba(255,255,255,0.2); color: white; border: none;
          border-radius: 8px; cursor: pointer; font-weight: 600;
          transition: all 0.2s; font-size: 0.9rem; min-height: 44px;
        }
        .btn-back:hover { background: rgba(255,255,255,0.3); }
        .btn-back-text { display: inline; }
        .btn-scan-qr {
          display: flex; align-items: center; gap: 6px; padding: 8px 14px;
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          color: white; border: none; border-radius: 8px; cursor: pointer;
          font-weight: 600; font-size: 0.85rem; text-decoration: none;
          transition: all 0.2s ease; min-height: 40px; white-space: nowrap;
        }
        .btn-scan-qr:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        .btn-scan-qr:active { transform: translateY(0); }
        .page-title { margin: 0; font-size: 1.4rem; font-weight: 700; flex: 1; word-break: break-word; }

        /* ── Subtitle / Date ────────────────────────────── */
        .subtitle {
          color: #374151; margin: 0 0 20px; font-size: 1rem;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .date-text {
          font-weight: 700; font-size: 1.05rem; color: #92400e;
          background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
          border: 1px solid #ffc107; padding: 4px 14px; border-radius: 20px;
          box-shadow: 0 2px 6px rgba(255,193,7,0.2);
        }

        /* ── Checker Card ───────────────────────────────── */
        .checker-card {
          background: white; border-radius: 12px; padding: 16px 20px;
          margin-bottom: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.07);
          display: flex; gap: 16px; flex-wrap: wrap; border: 1px solid #e8e8e8;
        }
        .checker-field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 180px; }
        .field-label { font-size: 0.85rem; font-weight: 600; color: #374151; }
        .required-star { color: #dc2626; }
        .field-input {
          border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 14px;
          font-size: 0.9rem; outline: none; transition: all 0.2s;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);
        }
        .field-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
        .field-input:disabled { background: #f9fafb; cursor: not-allowed; }
/* Pastikan select ID Zona memiliki lebar yang pas */
.id-zona-select {
  width: 80px;
  min-width: 80px;
  padding: 7px 10px;
  font-size: 0.82rem;
}

/* Untuk mobile: select ID Zona full width */
@media (max-width: 768px) {
  .id-zona-select {
    width: 100%;
    min-width: unset;
  }
}
        /* ── Banners ────────────────────────────────────── */
        .banner {
          border-radius: 10px; padding: 12px 18px; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px; font-weight: 500;
        }
        .banner-loading {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe; color: #1d4ed8;
          box-shadow: 0 2px 8px rgba(59,130,246,0.12);
        }
        .banner-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b; color: #92400e;
          box-shadow: 0 2px 8px rgba(245,158,11,0.12);
        }
        .banner-success {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #86efac; color: #166534;
          box-shadow: 0 2px 8px rgba(134,239,172,0.2);
        }
        .banner-btn {
          margin-left: auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white; border: none; border-radius: 7px; padding: 5px 14px;
          cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(245,158,11,0.3);
        }
        .banner-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(245,158,11,0.4); }
        .scan-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b; justify-content: space-between;
        }
        .scan-warning .banner-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          padding: 6px 16px;
        }
        .scan-warning .banner-btn:hover {
          transform: translateY(-1px); box-shadow: 0 4px 10px rgba(124, 58, 237, 0.4);
        }
        .spinner-inline { animation: spin 1s linear infinite; display: inline-block; font-size: 1.1rem; }

        /* ── Loading Overlay ────────────────────────────── */
        .loading-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7); display: flex; flex-direction: column;
          justify-content: center; align-items: center; z-index: 9999; color: white;
        }
        .spinner {
          width: 60px; height: 60px; border: 6px solid rgba(255,255,255,0.3);
          border-top-color: #4caf50; border-radius: 50%;
          animation: spin 0.8s linear infinite; margin-bottom: 16px;
        }

        /* ── Card Container ─────────────────────────────── */
        .card-container {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          padding: 24px; color: white; position: relative;
        }
        .preview-mode {
          background: linear-gradient(135deg, #0d47a1 0%, #1976d2 100%);
        }

        /* ── Desktop/Mobile Toggle ──────────────────────── */
        .desktop-view { display: block; }
        .mobile-view { display: none; }

        /* ── Table ──────────────────────────────────────── */
        .table-scroll-wrapper {
          overflow-x: auto; -webkit-overflow-scrolling: touch;
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 24px;
        }
        .table-scroll-wrapper::-webkit-scrollbar { height: 6px; }
        .table-scroll-wrapper::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .table-scroll-wrapper::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.4); border-radius: 3px; }

        .checklist-table, .simple-table {
          width: 100%; min-width: max-content; border-collapse: collapse;
          color: white; font-size: 0.82rem; table-layout: auto;
        }
        .checklist-table th, .checklist-table td,
        .simple-table th, .simple-table td {
          padding: 10px 12px; text-align: left;
          border: 1px solid rgba(255,255,255,0.2); white-space: nowrap; vertical-align: middle;
          color: white
        }
        .checklist-table th, .simple-table th {
          background: rgba(0,0,0,0.15); font-weight: 600; position: sticky; top: 0;
          z-index: 10; text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .th-center { text-align: center; }
        .td-center { text-align: center; }
        .sticky-col {
          position: sticky; left: 0; background: rgba(30,60,114,0.95); z-index: 8;
          box-shadow: 2px 0 4px rgba(0,0,0,0.2);
        }
        .checklist-table th.sticky-col, .simple-table th.sticky-col {
          background: rgba(0,0,0,0.2); z-index: 15;
        }
        .row-ng { background: rgba(244,67,54,0.1) !important; }

        /* ── Form Controls ──────────────────────────────── */
        .notes-input, .status-select {
          width: 100%; padding: 7px 10px; border: 1px solid rgba(255,255,255,0.4);
          border-radius: 6px; font-size: 0.82rem; background: rgba(255,255,255,0.92);
          color: #333; min-height: 38px; transition: all 0.2s;
        }
        .notes-input:focus, .status-select:focus {
          outline: none; border-color: #4fc3f7;
          box-shadow: 0 0 0 2px rgba(79,195,247,0.3);
        }
        .notes-input:disabled, .status-select:disabled {
          background: rgba(255,255,255,0.5); cursor: not-allowed;
        }
        .input-error { border: 2px solid #f87171 !important; background: rgba(254,242,242,0.95) !important; }
        .id-zona-input { width: 68px; }

        .select-ok { background: rgba(220,252,231,0.95) !important; color: #166534 !important; font-weight: 700; }
        .select-ng { background: rgba(254,226,226,0.95) !important; color: #991b1b !important; font-weight: 700; }

        .info-cell {
          padding: 6px 10px; background: rgba(255,255,255,0.15);
          border-radius: 6px; color: #93c5fd; font-weight: 500; font-size: 0.8rem;
          white-space: nowrap;
        }

        /* ── Delete col ─────────────────────────────────── */
        .delete-col { text-align: center; }
        .delete-btn {
          background: rgba(244,67,54,0.8); color: white; border: none;
          border-radius: 6px; width: 28px; height: 28px; cursor: pointer;
          font-size: 0.75rem; font-weight: 700; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; margin: 0 auto;
        }
        .delete-btn:hover { background: #f44336; transform: scale(1.1); }
        .delete-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* ── Image Upload ───────────────────────────────── */
        .image-upload { display: flex; justify-content: center; align-items: center; min-height: 44px; }
        .image-preview { position: relative; width: 72px; height: 72px; }
        .uploaded-image { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; border: 2px solid white; cursor: zoom-in; }
        .preview-image { max-width: 72px; max-height: 72px; object-fit: cover; border-radius: 6px; border: 2px solid white; cursor: zoom-in; }
        .remove-btn {
          position: absolute; top: -8px; right: -8px; background: #f44336; color: white;
          border: 2px solid white; border-radius: 50%; width: 22px; height: 22px;
          font-size: 12px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; padding: 0; transition: all 0.2s;
          min-height: 22px; min-width: 22px;
        }
        .remove-btn:hover { background: #d32f2f; transform: scale(1.1); }
        .remove-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .file-label {
          display: flex; align-items: center; justify-content: center;
          padding: 7px 14px; background: rgba(255,255,255,0.9); color: #333;
          border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: background 0.2s;
          min-height: 38px; gap: 4px;
        }
        .file-label-large { width: 100%; padding: 12px 16px; }
        .file-label:hover { background: rgba(255,255,255,1); }
        .file-input { display: none; }

        /* ── Status badges (table) ──────────────────────── */
        .status-ng {
          background: rgba(244,67,54,0.25); color: #ffcdd2;
          font-weight: 700; border-radius: 4px; padding: 3px 8px; font-size: 0.8rem;
        }
        .status-ok {
          background: rgba(76,175,80,0.25); color: #c8e6c9;
          font-weight: 700; border-radius: 4px; padding: 3px 8px; font-size: 0.8rem;
        }

        /* ── Form Actions ───────────────────────────────── */
        .form-actions, .preview-actions {
          display: flex; gap: 14px; justify-content: flex-end;
          margin-top: 20px; flex-wrap: wrap;
        }
        .btn-cancel, .btn-submit, .btn-add-item, .cancel-btn, .save-btn, .btn-delete-mobile {
          padding: 11px 22px; border: none; border-radius: 9px; font-weight: 600;
          cursor: pointer; font-size: 0.95rem; transition: all 0.2s; min-height: 46px;
        }
        .btn-cancel, .cancel-btn {
          background: rgba(255,255,255,0.2); color: white;
        }
        .btn-cancel:hover, .cancel-btn:hover { background: rgba(255,255,255,0.3); }
        .btn-cancel:disabled, .cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-add-item { background: rgba(79,195,247,0.85); color: white; }
        .btn-add-item:hover { background: rgba(79,195,247,1); transform: translateY(-1px); }
        .btn-add-item:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-submit { background: #4caf50; color: white; box-shadow: 0 4px 12px rgba(76,175,80,0.3); }
        .btn-submit:hover { background: #43a047; transform: translateY(-1px); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .save-btn { background: #2e7d32; color: white; box-shadow: 0 4px 12px rgba(46,125,50,0.3); }
        .save-btn:hover { background: #1b5e20; transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-delete-mobile {
          background: rgba(244,67,54,0.8); color: white; width: 100%;
          margin-top: 8px; font-size: 0.9rem;
        }
        .btn-delete-mobile:hover { background: #f44336; }
        .btn-delete-mobile:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Mobile Card View ───────────────────────────── */
        .checklist-card, .preview-card {
          background: rgba(255,255,255,0.1); border-radius: 12px;
          margin-bottom: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);
        }
        .preview-card-ng { border-color: rgba(244,67,54,0.5); background: rgba(244,67,54,0.08); }
        .card-header, .preview-card-header {
          display: flex; align-items: center; gap: 12px; padding: 14px 16px;
          cursor: pointer; background: rgba(0,0,0,0.1); transition: background 0.2s; min-height: 44px;
        }
        .card-header:hover, .preview-card-header:hover { background: rgba(0,0,0,0.18); }
        .card-no, .preview-card-no {
          width: 34px; height: 34px; background: #1976d2; color: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.95rem; flex-shrink: 0;
        }
        .card-info { flex: 1; min-width: 0; }
        .card-zona { font-size: 0.78rem; color: rgba(255,255,255,0.75); margin-bottom: 2px; }
        .card-lokasi { font-size: 0.95rem; font-weight: 600; color: white; word-break: break-word; }
        .card-ng-badge {
          background: rgba(244,67,54,0.8); color: white; font-size: 0.7rem;
          font-weight: 700; padding: 2px 8px; border-radius: 10px; flex-shrink: 0;
        }
        .expand-icon {
          font-size: 1rem; color: rgba(255,255,255,0.8); transition: transform 0.3s;
        }
        .expand-icon.expanded { transform: rotate(180deg); }
        .card-body { padding: 16px; background: rgba(0,0,0,0.08); }

        /* ── Mobile: checklist section ──────────────────── */
        .checklist-section { margin-bottom: 14px; }
        .section-title {
          font-size: 0.9rem; font-weight: 600; color: white; margin: 0 0 10px;
          padding-bottom: 7px; border-bottom: 2px solid rgba(255,255,255,0.2);
        }
        .check-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .check-row:last-child { border-bottom: none; }
        .check-label { font-size: 0.85rem; color: rgba(255,255,255,0.9); flex: 1; padding-right: 10px; }
        .check-select {
          width: auto; min-width: 90px; padding: 7px 10px; border: 1px solid rgba(255,255,255,0.4);
          border-radius: 6px; font-size: 0.85rem; background: rgba(255,255,255,0.92);
          color: #333; min-height: 40px;
        }

        /* ── Form Group (mobile) ────────────────────────── */
        .form-group { margin-bottom: 14px; }
        .form-group:last-child { margin-bottom: 0; }
        .form-group label {
          display: block; margin-bottom: 5px; font-size: 0.88rem;
          color: rgba(255,255,255,0.9); font-weight: 500;
        }

        /* ── Preview Section ────────────────────────────── */
        .preview-title {
          margin: 0 0 20px; color: white; font-size: 1.5rem; text-align: center; font-weight: 700;
        }
        .preview-summary {
          background: rgba(255,255,255,0.1); border-radius: 10px;
          padding: 14px 18px; margin-bottom: 20px;
          display: flex; flex-wrap: wrap; gap: 14px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .summary-item { display: flex; flex-direction: column; gap: 2px; }
        .summary-label { font-size: 0.75rem; color: rgba(255,255,255,0.7); font-weight: 500; }
        .summary-value { font-size: 0.95rem; color: white; font-weight: 600; }
        .summary-ng { color: #fca5a5 !important; }

        .preview-card-header {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; background: rgba(0,0,0,0.1); cursor: default;
        }
        .preview-card-header:hover { background: rgba(0,0,0,0.1); }
        .preview-card-lokasi { flex: 1; font-weight: 600; color: white; font-size: 0.9rem; }
        .preview-card-status {
          padding: 3px 10px; border-radius: 12px; font-weight: 600; font-size: 0.78rem;
        }
        .preview-card-body { padding: 14px 16px; background: rgba(0,0,0,0.08); }
        .preview-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.1); gap: 12px;
        }
        .preview-row:last-child { border-bottom: none; }
        .preview-label {
          font-size: 0.82rem; color: rgba(255,255,255,0.75); font-weight: 500;
          min-width: 80px; flex-shrink: 0;
        }
        .preview-value { font-size: 0.88rem; color: white; word-break: break-word; text-align: right; flex: 1; }
        .preview-card-image {
          width: 56px; height: 56px; object-fit: cover; border-radius: 6px;
          border: 2px solid white; cursor: zoom-in; margin-left: auto; display: block;
        }

        /* ── Image Modal ────────────────────────────────── */
        .image-modal {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85); display: flex; justify-content: center;
          align-items: center; z-index: 9999; padding: 20px; cursor: zoom-out;
          backdrop-filter: blur(6px);
        }
        .modal-content { position: relative; max-width: 90vw; max-height: 90vh; }
        .modal-close-btn {
          position: absolute; top: -14px; right: -14px; background: #f44336; color: white;
          border: 2px solid white; border-radius: 50%; width: 36px; height: 36px;
          font-size: 1rem; cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-weight: 700; transition: all 0.2s; z-index: 10;
        }
        .modal-close-btn:hover { background: #d32f2f; transform: scale(1.1); }
        .modal-image { max-width: 100%; max-height: 85vh; border-radius: 10px; border: 3px solid white; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }

        /* ── Responsive: Tablet ─────────────────────────── */
        @media (max-width: 1024px) {
          .page-content { padding: 20px 16px; }
          .page-title { font-size: 1.3rem; }
          .checklist-table, .simple-table { font-size: 0.8rem; }
          .checklist-table th, .checklist-table td,
          .simple-table th, .simple-table td { padding: 8px 10px; }
        }

        /* ── Responsive: Mobile ─────────────────────────── */
        @media (max-width: 768px) {
          .page-content { padding: 14px 10px; margin-left: 0; }
          .header-banner { padding: 12px 14px; flex-direction: column; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
          .btn-back { width: 100%; justify-content: center; }
          .btn-scan-qr { order: 2; width: 100%; justify-content: center; }
          .page-title { font-size: 1.2rem; width: 100%; }
          .card-container { padding: 14px 10px; }
          .desktop-view { display: none; }
          .mobile-view { display: block; }
          .form-actions, .preview-actions {
            flex-direction: column; gap: 10px;
          }
          .btn-cancel, .btn-submit, .btn-add-item, .cancel-btn, .save-btn {
            width: 100%; min-height: 50px; font-size: 0.95rem;
          }
          .checker-card { padding: 14px; }
          .preview-summary { flex-direction: column; gap: 10px; }
        }

        /* ── Responsive: Small Mobile ───────────────────── */
        @media (max-width: 480px) {
          .page-content { padding: 10px 8px; }
          .header-banner { padding: 10px 12px; }
          .page-title { font-size: 1.05rem; }
          .date-text { font-size: 0.9rem; padding: 3px 10px; }
          .card-container { padding: 10px 8px; }
          .card-header { padding: 12px; }
          .card-no { width: 30px; height: 30px; font-size: 0.85rem; }
          .card-body { padding: 12px; }
          .check-row { padding: 7px 0; }
          .check-label { font-size: 0.78rem; }
          .check-select { min-width: 82px; font-size: 0.82rem; }
          .notes-input, .status-select, .field-input { font-size: 0.9rem; min-height: 42px; }
          .file-label { padding: 9px 12px; font-size: 0.82rem; min-height: 42px; }
          .btn-cancel, .btn-submit, .btn-add-item, .cancel-btn, .save-btn {
            min-height: 52px; font-size: 0.92rem; padding: 12px 18px;
          }
          .preview-title { font-size: 1.25rem; }
        }

        /* ── Touch-friendly ─────────────────────────────── */
        @media (hover: none) and (pointer: coarse) {
          .status-select, .notes-input, .check-select, .file-label, .field-input {
            font-size: 16px; min-height: 44px;
          }
          .btn-back, .btn-cancel, .btn-submit, .btn-add-item, .cancel-btn, .save-btn { min-height: 44px; }
          .remove-btn { min-height: 36px; min-width: 36px; width: 36px; height: 36px; }
        }

        *, *::before, *::after { box-sizing: border-box; }
        img, svg, video { max-width: 100%; height: auto; display: block; }
        html, body { overflow-x: hidden; width: 100%; min-width: 0; }
      `}</style>
    </div>
  );
}