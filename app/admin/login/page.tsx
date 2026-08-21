"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

// ──────────────────────────────────────────────────────────────────────────────
// AUTH FETCH HELPER
// ──────────────────────────────────────────────────────────────────────────────
function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window === "undefined") return fetch(url, options);
  try {
    const userStr = localStorage.getItem("auth_current_user_v2");
    if (userStr) {
      const u = JSON.parse(userStr);
      options.headers = {
        "Content-Type": "application/json",
        ...options.headers,
        "x-user-id": String(u.id || ""),
        "x-user-role": String(u.role || ""),
        "x-username": String(u.username || ""),
      };
    }
  } catch { }
  return fetch(url, options);
}

// ──────────────────────────────────────────────────────────────────────────────
// HOOK: useSidebarWidth
// ──────────────────────────────────────────────────────────────────────────────
function useSidebarWidth() {
  const COLLAPSED_W = 70;
  const EXPANDED_W = 240;
  const [sidebarW, setSidebarW] = useState(COLLAPSED_W);

  useEffect(() => {
    const readCssVar = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-w").trim();
      if (v) setSidebarW(parseInt(v));
    };
    readCssVar();

    const onToggle = (e: Event) => {
      const { width } = (e as CustomEvent<{ expanded: boolean; width: number }>).detail;
      setSidebarW(width);
    };

    window.addEventListener("sidebarToggle", onToggle);
    return () => window.removeEventListener("sidebarToggle", onToggle);
  }, []);

  return sidebarW;
}

// ──────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ──────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS & CHECKSHEET DATA
// ──────────────────────────────────────────────────────────────────────────────
type ChecksheetKey = string;

interface ChecksheetOption {
  key: ChecksheetKey;
  label: string;
  path: string;
  description: string;
  icon?: string;
}

interface ChecksheetCategory {
  id: string;
  title: string;
  icon: string;
  items: ChecksheetOption[];
}

interface WorkerFormData {
  username: string;
  fullName: string;
  nik: string;
  password: string;
  confirmPassword: string;
  department: "general-affairs" | "ga";
  role: string;
  checksheets: ChecksheetKey[];
}

interface FormErrors {
  username?: string;
  fullName?: string;
  nik?: string;
  password?: string;
  confirmPassword?: string;
  department?: string;
  role?: string;
  checksheets?: string;
  general?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// ALL CHECKSHEETS GROUPED BY CATEGORY (Kategori sebagai pemisah tampilan)
// ──────────────────────────────────────────────────────────────────────────────
const CHECKSHEET_CATEGORIES: ChecksheetCategory[] = [
  {
    id: "fire",
    title: "1. Sistem Proteksi Kebakaran & Evakuasi",
    icon: "🔥",
    items: [
      { key: "hydrant", label: "🚒 Hydrant", path: "/status-ga/hydrant", description: "Inspeksi rutin sistem hydrant", icon: "🚒" },
      { key: "selang-hydrant", label: "💧 Selang Hydrant", path: "/status-ga/selang-hydrant", description: "Cek tekanan air, coupling, nozzle", icon: "💧" },
      { key: "fire-alarm", label: "🔔 Fire Alarm", path: "/status-ga/inspeksi-fire-alarm", description: "Cek fungsi alarm & detector", icon: "🔔" },
      { key: "smoke-detector", label: "💨 Smoke Detector", path: "/status-ga/smoke-detector", description: "Testing sensor asap", icon: "💨" },
      { key: "apar", label: "🧯 APAR", path: "/status-ga/inspeksi-apar", description: "Pemeriksaan alat pemadam api ringan", icon: "🧯" },
      { key: "emergency-lamp", label: "🚨 Emergency Lamp", path: "/status-ga/inspeksi-emergency", description: "Lampu darurat & exit lamp", icon: "🚨" },
      { key: "exit-lamp-pintu-darurat", label: "🚶 Jalur Evakuasi", path: "/status-ga/exit-lamp-pintu-darurat", description: "Pemeriksaan jalur & titik kumpul", icon: "🚶" },
    ]
  },
  {
    id: "equipment",
    title: "2. Keselamatan dan Pemeliharaan Peralatan",
    icon: "⚙️",
    items: [
      { key: "lift-barang", label: "🛗 Lift Barang (Daily)", path: "/status-ga/lift-barang", description: "Checklist harian operasional lift", icon: "🛗" },
      { key: "inspeksi-preventif-lift-barang", label: "🔧 Preventif Lift", path: "/status-ga/inspeksi-preventif-lift-barang", description: "Maintenance berkala lift barang", icon: "🔧" },
      { key: "tg-listrik", label: "🪜 Tangga Listrik (AWP)", path: "/status-ga/tg-listrik", description: "Inspeksi alat kerja tinggi", icon: "🪜" },
    ]
  },
  {
    id: "electrical",
    title: "3. Keselamatan dan Instalasi Listrik",
    icon: "⚡",
    items: [
      { key: "panel", label: "⚡ Panel Listrik", path: "/status-ga/panel", description: "Cek kondisi panel distribusi", icon: "⚡" },
      { key: "form-inspeksi-stop-kontak", label: "🔌 Stop Kontak", path: "/status-ga/form-inspeksi-stop-kontak", description: "Pemeriksaan outlet area kerja", icon: "🔌" },
    ]
  },
  {
    id: "personal",
    title: "4. Keselamatan Personal dan Prasarana Umum",
    icon: "🦺",
    items: [
      { key: "e-checksheet-apd", label: "🦺 Form APD", path: "/status-ga/e-checksheet-apd/riwayat-apd", description: "Pencatatan pengambilan APD", icon: "🦺" },
      { key: "inf-jalan", label: "🛣️ Infrastruktur Jalan", path: "/status-ga/inf-jalan", description: "Pemeriksaan kondisi jalan internal", icon: "🛣️" },
      { key: "inspeksi-apd", label: "🔍 Inspeksi APD", path: "/status-ga/inspeksi-apd", description: "Cek kelayakan alat pelindung", icon: "🔍" },
    ]
  },
  {
    id: "facility",
    title: "5. Kebersihan dan Kenyamanan Fasilitas",
    icon: "🧹",
    items: [
      { key: "checksheet-toilet", label: "🚽 Checksheet Toilet", path: "/status-ga/checksheet-toilet", description: "Inspeksi kebersihan toilet", icon: "🚽" },
    ]
  }
];

// Flat list of all available checksheets
const ALL_CHECKSHEETS: ChecksheetOption[] = CHECKSHEET_CATEGORIES.flatMap(cat => cat.items);

// ──────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const validateForm = (data: WorkerFormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.username.trim()) errors.username = "Username wajib diisi";
  else if (data.username.length < 4) errors.username = "Username minimal 4 karakter";

  if (!data.fullName.trim()) errors.fullName = "Nama lengkap wajib diisi";

  if (!data.nik.trim()) errors.nik = "NIK wajib diisi";
  else if (!/^\d{6,}$/.test(data.nik)) errors.nik = "NIK minimal 6 digit angka";

  if (!data.password) errors.password = "Password wajib diisi";
  else if (data.password.length < 6) errors.password = "Password minimal 6 karakter";

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password tidak cocok";
  }

  if (!data.checksheets || data.checksheets.length === 0) {
    errors.checksheets = "Pilih minimal 1 checksheet yang boleh diakses user ini";
  }

  if (!data.department) errors.department = "Pilih departemen terlebih dahulu";

  return errors;
};

// ──────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ──────────────────────────────────────────────────────────────────────────────
export default function WorkerRegistrationPage() {
  const router = useRouter();
  const { user, loading: authLoading, isInitialized, signup } = useAuth();
  const sidebarW = useSidebarWidth();

  const [formData, setFormData] = useState<WorkerFormData>({
    username: "",
    fullName: "",
    nik: "",
    password: "",
    confirmPassword: "",
    department: "general-affairs",
    role: "inspector-ga",
    checksheets: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [expandedChecksheet, setExpandedChecksheet] = useState<ChecksheetKey | null>(null);

  useEffect(() => {
    if (!isInitialized || authLoading) return;
    if (!user) {
      router.push("/e-checksheet-ga/login-page");
      return;
    }
    if (!["admin", "superadmin"].includes(user.role)) {
      router.push("/home");
    }
  }, [user, authLoading, isInitialized, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleChecksheetToggle = (checksheetKey: ChecksheetKey) => {
    setFormData(prev => {
      const current = prev.checksheets || [];
      const isSelected = current.includes(checksheetKey);
      const updated = isSelected
        ? current.filter(k => k !== checksheetKey)
        : [...current, checksheetKey];
      return { ...prev, checksheets: updated };
    });

    if (errors.checksheets) {
      setErrors(prev => ({ ...prev, checksheets: undefined }));
    }
  };

  const handleCategoryToggle = (categoryItems: ChecksheetOption[]) => {
    const categoryKeys = categoryItems.map(item => item.key);
    const allSelected = categoryKeys.every(key => formData.checksheets.includes(key));

    setFormData(prev => {
      let updated: string[];
      if (allSelected) {
        // Remove all items in this category
        updated = prev.checksheets.filter(key => !categoryKeys.includes(key));
      } else {
        // Add missing items from this category
        const toAdd = categoryKeys.filter(key => !prev.checksheets.includes(key));
        updated = [...prev.checksheets, ...toAdd];
      }
      return { ...prev, checksheets: updated };
    });

    if (errors.checksheets) {
      setErrors(prev => ({ ...prev, checksheets: undefined }));
    }
  };

  const handleSelectAllChecksheets = (selectAll: boolean) => {
    if (selectAll) {
      setFormData(prev => ({
        ...prev,
        checksheets: ALL_CHECKSHEETS.map(cs => cs.key)
      }));
    } else {
      setFormData(prev => ({ ...prev, checksheets: [] }));
    }
    if (errors.checksheets) {
      setErrors(prev => ({ ...prev, checksheets: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.keys(validationErrors)[0];
      if (firstError === "checksheets") {
        document.getElementById("checksheet-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signup({
        username: formData.username,
        fullName: formData.fullName,
        nik: formData.nik,
        department: formData.department,
        role: (formData.role || "inspector-ga") as any,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        checksheets: formData.checksheets,
      });

      if (result.success) {
        const selectedChecks = formData.checksheets
          .map(key => ALL_CHECKSHEETS.find(cs => cs.key === key)?.label)
          .filter(Boolean)
          .join(", ");

        setSuccessMessage(`✅ User "${formData.fullName}" berhasil mendaftar!\n📋 Checksheet Terpilih (${formData.checksheets.length}): ${selectedChecks}`);

        setFormData({
          username: "",
          fullName: "",
          nik: "",
          password: "",
          confirmPassword: "",
          department: "general-affairs",
          role: "inspector-ga",
          checksheets: [],
        });
      } else {
        setErrors({ general: result.error || "Pendaftaran gagal!" });
      }
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({ general: "Terjadi kesalahan sistem. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isInitialized) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f4f8" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid #e2e8f0", borderTopColor: "#1e88e5", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Memuat...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!user) return null;

  const mainStyle: React.CSSProperties = {
    marginLeft: sidebarW,
    padding: 24,
    minHeight: "100vh",
    background: "#f0f4f8",
    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const selectedChecksheetDetails = formData.checksheets
    .map(key => ALL_CHECKSHEETS.find(cs => cs.key === key))
    .filter(Boolean) as ChecksheetOption[];

  return (
    <>
      <Sidebar userName={user.fullName || user.username} />
      <main className="wr-main" style={mainStyle}>

        {/* ── HEADER BANNER ── */}
        <div className="wr-header">
          <div className="wr-header-banner">
            <div className="wr-header-banner-bg" />
            <div className="wr-header-content">
              <div className="wr-header-left">
                <div className="wr-header-icon-wrap">
                  <span style={{ fontSize: 30, lineHeight: 1 }}>👥</span>
                </div>
                <div>
                  <h1 className="wr-title">Registrasi User / Inspector GA</h1>
                  <p className="wr-subtitle">Pilih fleksibel checksheet yang dapat diisi oleh user (bisa dari berbagai jenis/kategori)</p>
                </div>
              </div>
              <div className="wr-header-right">
                <div className="wr-stat-badge">
                  <span className="wr-stat-number">{CHECKSHEET_CATEGORIES.length}</span>
                  <span className="wr-stat-label">Kategori</span>
                </div>
                <div className="wr-stat-badge">
                  <span className="wr-stat-number">{ALL_CHECKSHEETS.length}</span>
                  <span className="wr-stat-label">Total Checksheet</span>
                </div>
                <button className="wr-back-btn" onClick={() => router.back()} title="Kembali">
                  ← Kembali
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SUCCESS MESSAGE ── */}
        {successMessage && (
          <div className="wr-success">
            <span>✨</span>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{successMessage}</pre>
            <button onClick={() => setSuccessMessage("")}>✕</button>
          </div>
        )}

        {/* ── FORM CARD ── */}
        <div className="wr-card">
          <div className="wr-card-header">
            <h2>📝 Form Pendaftaran User (Pemilihan Checksheet)</h2>
            <p className="wr-card-desc">Isi data akun user dan pilih checksheet apa saja yang dapat diakses oleh user ini</p>
          </div>

          <form className="wr-form" onSubmit={handleSubmit}>
            {/* General Error */}
            {errors.general && <div className="wr-error-global">⚠️ {errors.general}</div>}

            {/* ── FORM GRID ── */}
            <div className="wr-form-grid">

              {/* Username */}
              <div className="wr-form-group">
                <label htmlFor="username">Username <span className="required">*</span></label>
                <input
                  id="username" type="text" name="username"
                  placeholder="contoh: user_ga01"
                  value={formData.username} onChange={handleChange}
                  disabled={loading} className={errors.username ? "error" : ""}
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              {/* Full Name */}
              <div className="wr-form-group">
                <label htmlFor="fullName">Nama Lengkap <span className="required">*</span></label>
                <input
                  id="fullName" type="text" name="fullName"
                  placeholder="Nama lengkap user"
                  value={formData.fullName} onChange={handleChange}
                  disabled={loading} className={errors.fullName ? "error" : ""}
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>

              {/* NIK */}
              <div className="wr-form-group">
                <label htmlFor="nik">NIK <span className="required">*</span></label>
                <input
                  id="nik" type="text" name="nik"
                  placeholder="Nomor Induk Karyawan"
                  value={formData.nik} onChange={handleChange}
                  disabled={loading} className={errors.nik ? "error" : ""}
                />
                {errors.nik && <span className="error-text">{errors.nik}</span>}
              </div>

              {/* Department */}
              <div className="wr-form-group">
                <label>Departemen <span className="required">*</span></label>
                <div className="fixed-field">
                  <span className="fixed-value">🏢 General Affairs (GA)</span>
                  <input type="hidden" name="department" value={formData.department} />
                </div>
              </div>

              {/* Password */}
              <div className="wr-form-group">
                <label htmlFor="password">Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    id="password" type={showPassword ? "text" : "password"} name="password"
                    placeholder="Minimal 6 karakter"
                    value={formData.password} onChange={handleChange}
                    disabled={loading} className={errors.password ? "error" : ""}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className="wr-form-group">
                <label htmlFor="confirmPassword">Konfirmasi Password <span className="required">*</span></label>
                <div className="password-wrapper">
                  <input
                    id="confirmPassword" type={showConfirmPassword ? "text" : "password"} name="confirmPassword"
                    placeholder="Ulangi password"
                    value={formData.confirmPassword} onChange={handleChange}
                    disabled={loading} className={errors.confirmPassword ? "error" : ""}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading}>
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              {/* ══════════════════════════════════════════════════ */}
              {/* CHECKSHEET SELECTION BY CATEGORY                   */}
              {/* ══════════════════════════════════════════════════ */}
              <div
                className="wr-form-group full-width step-section checksheet-step"
                id="checksheet-section"
              >
                <div className="step-section-header">
                  <div className="step-badge step-badge-2">SELEKSI CHECKSHEET</div>
                  <label>Pilih Checksheet Yang Boleh Diisi User <span className="required">*</span></label>
                </div>

                <div className="checksheet-info-banner">
                  <div className="banner-icon">🎯</div>
                  <div className="banner-content">
                    <strong>Bisa Memilih Bebas Dari Segala Jenis Checksheet</strong>
                    <p>Centang satu atau lebih checksheet yang ingin ditugaskan kepada user ini. Jenis/Kategori digunakan sebagai pemisah kelompok checksheet saja.</p>
                  </div>
                </div>

                <div className="checksheet-header">
                  <div className="checksheet-counter">
                    <span className={`counter-badge ${formData.checksheets.length > 0 ? "has-selection" : ""}`}>
                      {formData.checksheets.length}
                    </span>
                    <span className="counter-text">dari {ALL_CHECKSHEETS.length} total checksheet dipilih</span>
                  </div>
                  <div className="checksheet-actions">
                    <button type="button" className="btn-sm btn-outline" onClick={() => handleSelectAllChecksheets(true)}>✓ Pilih Semua</button>
                    <button type="button" className="btn-sm btn-outline" onClick={() => handleSelectAllChecksheets(false)}>✗ Kosongkan Semua</button>
                  </div>
                </div>

                {errors.checksheets && <span className="error-text" style={{ marginBottom: 12, display: "block" }}>{errors.checksheets}</span>}

                {/* Render categories as headers/dividers */}
                <div className="category-group-wrapper" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {CHECKSHEET_CATEGORIES.map(cat => {
                    const categoryKeys = cat.items.map(item => item.key);
                    const selectedCountInCat = cat.items.filter(item => formData.checksheets.includes(item.key)).length;
                    const isAllInCatSelected = selectedCountInCat === cat.items.length;

                    return (
                      <div key={cat.id} className="category-group" style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                        <div className="category-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, borderBottom: "1px dashed #cbd5e1", paddingBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{cat.icon}</span>
                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{cat.title}</h3>
                            <span style={{ fontSize: 11, background: "#e2e8f0", color: "#475569", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                              {selectedCountInCat} / {cat.items.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-sm btn-outline"
                            onClick={() => handleCategoryToggle(cat.items)}
                            style={{ fontSize: 11 }}
                          >
                            {isAllInCatSelected ? "✗ Uncheck Kategori Ini" : "✓ Pilih Kategori Ini"}
                          </button>
                        </div>

                        <div className="checksheet-grid">
                          {cat.items.map(cs => {
                            const isSelected = formData.checksheets.includes(cs.key);
                            const isExpanded = expandedChecksheet === cs.key;
                            return (
                              <label key={cs.key} className={`checksheet-card ${isSelected ? "selected" : ""}`}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleChecksheetToggle(cs.key)}
                                  disabled={loading}
                                  className="checksheet-checkbox"
                                />
                                <div className="checksheet-card-content">
                                  <div className="checksheet-main">
                                    <span className="checksheet-icon">{cs.icon}</span>
                                    <span className="checksheet-label">{cs.label}</span>
                                    <div className={`custom-checkbox ${isSelected ? "checked" : ""}`}>
                                      {isSelected && <span>✓</span>}
                                    </div>
                                  </div>
                                  <p className="checksheet-desc">{cs.description}</p>

                                  <button
                                    type="button"
                                    className="checksheet-expand-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedChecksheet(isExpanded ? null : cs.key);
                                    }}
                                  >
                                    {isExpanded ? "▲ Sembunyikan detail" : "▼ Lihat detail"}
                                  </button>

                                  {isExpanded && (
                                    <div className="checksheet-details">
                                      <div className="detail-row">
                                        <strong>Path:</strong>
                                        <code>{cs.path}</code>
                                      </div>
                                      <div className="detail-row">
                                        <strong>Key:</strong>
                                        <code>{cs.key}</code>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="checksheet-hint">
                  💡 <strong>Tips:</strong> User dapat menggunakan beberapa jenis checksheet sekaligus sesuai dengan yang di-centang di atas.
                </div>
              </div>
            </div>

            {/* ── SELECTED PREVIEW ── */}
            {selectedChecksheetDetails.length > 0 && (
              <div className="role-preview">
                <h4>✅ Ringkasan Akses Checksheet ({selectedChecksheetDetails.length}):</h4>
                <div className="preview-grid">
                  <div className="preview-item full">
                    <div className="checksheet-tags">
                      {selectedChecksheetDetails.map(cs => (
                        <span key={cs.key} className="checksheet-tag">
                          {cs.icon} {cs.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUBMIT ACTIONS ── */}
            <div className="wr-form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (confirm("Reset semua field?")) {
                    setFormData({
                      username: "", fullName: "", nik: "", password: "", confirmPassword: "",
                      department: "general-affairs", role: "inspector-ga", checksheets: [],
                    });
                    setErrors({});
                  }
                }}
                disabled={loading}
              >
                🔄 Reset
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <><span className="spinner" /> Memproses...</> : "✅ Daftarkan User"}
              </button>
            </div>
          </form>
        </div>

        {/* ── INFO PANEL ── */}
        <div className="wr-info-panel">
          <h3>📋 Daftar Checksheet Yang Tersedia Per Kategori</h3>
          <div className="info-grid">
            {CHECKSHEET_CATEGORIES.map((cat, idx) => (
              <div key={cat.id} className="info-item">
                <strong>{cat.icon} {cat.title}</strong>
                <p><strong>Checksheet ({cat.items.length}):</strong></p>
                <ul className="checksheet-list">
                  {cat.items.map(cs => (
                    <li key={cs.key}><small>{cs.icon} {cs.label}</small></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>


      <style jsx>{`
        /* ════════════════════════════════════════════════════════════
           MAIN LAYOUT
        ════════════════════════════════════════════════════════════ */
        .wr-main {
          padding: 24px;
          min-height: 100vh;
          background: #f0f4f8;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ════════════════════════════════════════════════════════════
           HEADER BANNER
        ════════════════════════════════════════════════════════════ */
        .wr-header {
          margin-bottom: 24px;
        }
        .wr-header-banner {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #1e293b 0%, #1e3a5f 55%, #1565c0 100%);
          border-radius: 16px;
          box-shadow: 0 6px 28px rgba(21, 101, 192, 0.28);
        }
        .wr-header-banner-bg {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 18% 60%, rgba(30, 136, 229, 0.18) 0%, transparent 55%),
            radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.06) 0%, transparent 40%),
            radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.03) 0%, transparent 50%);
          pointer-events: none;
        }
        .wr-header-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .wr-header-left {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .wr-header-icon-wrap {
          width: 58px;
          height: 58px;
          background: rgba(255, 255, 255, 0.13);
          border: 1.5px solid rgba(255, 255, 255, 0.22);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .wr-title {
          margin: 0 0 5px;
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
        }
        .wr-subtitle {
          margin: 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.62);
        }
        .wr-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .wr-stat-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 10px;
          padding: 10px 20px;
          min-width: 76px;
          transition: background 0.2s;
        }
        .wr-stat-badge:hover {
          background: rgba(255, 255, 255, 0.16);
        }
        .wr-stat-number {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
          letter-spacing: -1px;
        }
        .wr-stat-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.58);
          font-weight: 500;
          margin-top: 3px;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .wr-back-btn {
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .wr-back-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.35);
        }

        /* ════════════════════════════════════════════════════════════
           SUCCESS MESSAGE
        ════════════════════════════════════════════════════════════ */
        .wr-success {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          border-left: 4px solid #22c55e;
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 20px;
          animation: slideIn 0.3s ease;
        }
        .wr-success pre {
          margin: 0;
          font-size: 13px;
          color: #166534;
          font-weight: 500;
          flex: 1;
          line-height: 1.5;
        }
        .wr-success button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #166534;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .wr-success button:hover { opacity: 1; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ════════════════════════════════════════════════════════════
           FORM CARD
        ════════════════════════════════════════════════════════════ */
        .wr-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          margin-bottom: 24px;
          border: 2px solid #f1f5f9;
        }
        .wr-card-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .wr-card-header h2 {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        .wr-card-desc {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }

        /* ════════════════════════════════════════════════════════════
           STEP INDICATOR  (fixed — no font-size:0 trick)
        ════════════════════════════════════════════════════════════ */
        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          margin-bottom: 28px;
          padding: 20px 32px;
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border-radius: 12px;
          border: 2px solid #e2e8f0;
        }

        /* Default: dimmed / not yet reached */
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          opacity: 0.35;
          transition: opacity 0.3s, transform 0.3s;
        }
        .step-item.active,
        .step-item.completed {
          opacity: 1;
        }

        /* The circle */
        .step-number {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;       /* always visible — no font-size:0 */
          transition: all 0.3s;
          border: 2px solid transparent;
        }

        /* Active state: blue */
        .step-item.active .step-number {
          background: linear-gradient(135deg, #1e88e5, #1565c0);
          color: white;
          box-shadow: 0 4px 14px rgba(30, 136, 229, 0.35);
          border-color: #1e88e5;
        }

        /* Completed state: green — checkmark rendered via JSX, NOT ::after */
        .step-item.completed .step-number {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);
          border-color: #22c55e;
          font-size: 16px;       /* keep font-size normal so ✓ is visible */
        }

        /* Labels */
        .step-label {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          transition: color 0.3s;
        }
        .step-item.active .step-label    { color: #1e88e5; }
        .step-item.completed .step-label { color: #16a34a; }

        /* Connector line */
        .step-connector {
          flex: 1;
          max-width: 120px;
          height: 3px;
          background: #e2e8f0;
          margin: 0 16px 20px;
          border-radius: 2px;
          transition: background 0.4s;
        }
        .step-connector.done {
          background: linear-gradient(90deg, #22c55e, #86efac);
        }

        /* ════════════════════════════════════════════════════════════
           FORM GRID
        ════════════════════════════════════════════════════════════ */
        .wr-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .wr-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .wr-form-group.full-width { grid-column: 1 / -1; }
        .wr-form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .required { color: #ef4444; }
        .wr-form-group input,
        .wr-form-group select {
          padding: 12px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .wr-form-group input:focus,
        .wr-form-group select:focus {
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.15);
        }
        .wr-form-group input.error,
        .wr-form-group select.error {
          border-color: #ef4444;
          background: #fef2f2;
        }
        .wr-form-group input:disabled {
          background: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .error-text {
          font-size: 11px;
          color: #ef4444;
          font-weight: 500;
        }

        /* ── Fixed Department Field ── */
        .fixed-field {
          padding: 12px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          font-size: 14px;
          color: #475569;
          font-weight: 500;
        }
        .fixed-value {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ════════════════════════════════════════════════════════════
           STEP SECTIONS
        ════════════════════════════════════════════════════════════ */
        .step-section {
          background: #fafbfc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-top: 8px;
        }
        .step-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .step-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .step-badge-1 {
          background: linear-gradient(135deg, #1e88e5, #1565c0);
          color: white;
        }
        .step-badge-2 {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
        }
        .step-section-header label {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .step-description {
          margin: 0 0 16px;
          font-size: 12px;
          color: #64748b;
          padding-left: 68px;
        }
        .checksheet-step {
          animation: slideDown 0.35s ease;
          border-color: #a78bfa;
          background: linear-gradient(135deg, #faf5ff, #f3e8ff);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ════════════════════════════════════════════════════════════
           ROLE CARDS
        ════════════════════════════════════════════════════════════ */
        .role-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .role-card {
          position: relative;
          cursor: pointer;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          background: white;
          transition: all 0.2s;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .role-card:hover {
          border-color: #1e88e5;
          background: #eff6ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.12);
        }
        .role-card.selected {
          border-color: #1e88e5;
          background: #dbeafe;
          box-shadow: 0 4px 14px rgba(30, 136, 229, 0.22);
        }
        .role-radio {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }
        .role-card-content {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .role-icon  { font-size: 18px; }
        .role-name  { font-size: 13px; font-weight: 700; color: #1e293b; }
        .role-category { font-size: 11px; color: #64748b; font-weight: 500; }
        .role-desc  { font-size: 10px; color: #94a3b8; line-height: 1.4; margin-top: 2px; }

        /* ════════════════════════════════════════════════════════════
           CHECKSHEET INFO BANNER
        ════════════════════════════════════════════════════════════ */
        .checksheet-info-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 2px solid #93c5fd;
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 16px;
        }
        .banner-icon { font-size: 26px; flex-shrink: 0; }
        .banner-content strong {
          display: block;
          color: #1e40af;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .banner-content p {
          margin: 0;
          color: #3b82f6;
          font-size: 12px;
          line-height: 1.5;
        }

        /* ════════════════════════════════════════════════════════════
           CHECKSHEET HEADER & COUNTER
        ════════════════════════════════════════════════════════════ */
        .checksheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .checksheet-counter {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .counter-badge {
          background: #e2e8f0;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        .counter-badge.has-selection {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        }
        .counter-text {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        .checksheet-actions { display: flex; gap: 8px; }
        .btn-sm {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .btn-sm.btn-outline {
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .btn-sm.btn-outline:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        /* ════════════════════════════════════════════════════════════
           CHECKSHEET CARDS
        ════════════════════════════════════════════════════════════ */
        .checksheet-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
        }
        .checksheet-card {
          position: relative;
          cursor: pointer;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          background: white;
          transition: all 0.25s;
        }
        .checksheet-card:hover {
          border-color: #94a3b8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .checksheet-card.selected {
          border-color: #22c55e;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.2);
        }
        .checksheet-checkbox {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }
        .checksheet-card-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .checksheet-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .checksheet-icon  { font-size: 20px; }
        .checksheet-label { font-size: 13px; font-weight: 600; color: #1e293b; flex: 1; }

        /* Custom checkbox */
        .custom-checkbox {
          width: 24px;
          height: 24px;
          border: 2px solid #cbd5e1;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: white;
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 700;
        }
        .custom-checkbox.checked {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-color: #22c55e;
          color: white;
          box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
        }

        .checksheet-desc {
          margin: 0;
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
        }

        /* Expand button */
        .checksheet-expand-btn {
          margin-top: 4px;
          padding: 4px 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 10px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .checksheet-expand-btn:hover {
          background: #e2e8f0;
          color: #475569;
        }
        .checksheet-details {
          margin-top: 8px;
          padding: 10px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: slideDown 0.2s ease;
        }
        .detail-row {
          display: flex;
          gap: 8px;
          font-size: 11px;
        }
        .detail-row strong {
          color: #64748b;
          min-width: 40px;
        }
        .checksheet-details code {
          background: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          color: #0369a1;
        }

        /* Hint */
        .checksheet-hint {
          margin-top: 14px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #f59e0b;
          border-radius: 8px;
          font-size: 12px;
          color: #92400e;
          line-height: 1.5;
        }
        .checksheet-hint strong { color: #78350f; }

        /* ════════════════════════════════════════════════════════════
           PASSWORD FIELD
        ════════════════════════════════════════════════════════════ */
        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-wrapper input {
          width: 100%;
          padding-right: 40px;
        }
        .toggle-password {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .toggle-password:hover { opacity: 1; }
        .toggle-password:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ════════════════════════════════════════════════════════════
           ROLE PREVIEW SUMMARY
        ════════════════════════════════════════════════════════════ */
        .role-preview {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 24px;
        }
        .role-preview h4 {
          margin: 0 0 12px;
          font-size: 13px;
          color: #0369a1;
          font-weight: 600;
        }
        .preview-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .preview-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .preview-item.full {
          flex-direction: column;
          align-items: flex-start;
        }
        .preview-icon { font-size: 20px; }
        .preview-item strong { font-size: 13px; color: #0c4a6e; }
        .checksheet-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 6px;
        }
        .checksheet-tag {
          background: #dbeafe;
          color: #1e40af;
          font-size: 11px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* ════════════════════════════════════════════════════════════
           FORM ACTIONS
        ════════════════════════════════════════════════════════════ */
        .wr-form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .btn-primary {
          padding: 12px 24px;
          background: linear-gradient(135deg, #1e88e5, #1565c0);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(30, 136, 229, 0.35);
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        .btn-secondary {
          padding: 12px 20px;
          background: #f1f5f9;
          color: #475569;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
        .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ════════════════════════════════════════════════════════════
           GLOBAL ERROR
        ════════════════════════════════════════════════════════════ */
        .wr-error-global {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          font-size: 13px;
          color: #991b1b;
          font-weight: 500;
        }

        /* ════════════════════════════════════════════════════════════
           INFO PANEL
        ════════════════════════════════════════════════════════════ */
        .wr-info-panel {
          background: white;
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          border: 2px solid #f1f5f9;
        }
        .wr-info-panel h3 {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .info-item {
          padding: 14px;
          background: #f8fafc;
          border-radius: 10px;
          border-left: 3px solid #1e88e5;
        }
        .info-item strong {
          display: block;
          font-size: 13px;
          color: #1e293b;
          margin-bottom: 6px;
        }
        .info-item p {
          margin: 0 0 6px;
          font-size: 12px;
          color: #64748b;
        }
        .checksheet-list {
          margin: 0 0 8px;
          padding-left: 16px;
        }
        .checksheet-list li {
          margin: 2px 0;
          font-size: 11px;
          color: #475569;
        }
        .info-item small {
          display: block;
          font-size: 10px;
          color: #94a3b8;
          background: #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }

        /* ════════════════════════════════════════════════════════════
           RESPONSIVE
        ════════════════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .wr-main { margin-left: 0 !important; padding: 12px; }
          .wr-header-content { padding: 16px 18px; flex-direction: column; align-items: flex-start; }
          .wr-header-right { width: 100%; justify-content: space-between; }
          .wr-stat-badge { flex: 1; min-width: unset; }
          .wr-title { font-size: 17px; }
          .wr-subtitle { font-size: 12px; }
          .wr-form-grid { grid-template-columns: 1fr; }
          .role-grid, .checksheet-grid { grid-template-columns: 1fr; }
          .wr-form-actions { flex-direction: column-reverse; }
          .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
          .info-grid { grid-template-columns: 1fr; }
          .checksheet-header { flex-direction: column; align-items: flex-start; }
          .step-description { padding-left: 0; }
          .step-indicator { padding: 16px 20px; }
          .step-connector { max-width: 60px; margin: 0 8px 20px; }
        }
      `}</style>
    </>
  );
}