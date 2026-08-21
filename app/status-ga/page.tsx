"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context"
import { Sidebar } from "@/components/Sidebar"
import Link from "next/link"

// ──────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ──────────────────────────────────────────────────────────────────────────────
interface ChecksheetItem {
  name: string
  desc: string
  link: string
  key: string
  icon: string
}

interface Category {
  title: string
  icon: string
  items: ChecksheetItem[]
}

// ──────────────────────────────────────────────────────────────────────────────
// MASTER CHECKSHEET DATABASE - Semua checksheet dengan unique key & icon
// ──────────────────────────────────────────────────────────────────────────────
const ALL_CHECKSHEETS: Record<string, ChecksheetItem> = {
  // 🔥 Kategori 1: Proteksi Kebakaran & Evakuasi
  "hydrant": { name: "INSPEKSI HYDRANT", desc: "Cek kondisi fisik dan fungsional hidran", link: "inspeksi-hydrant", key: "hydrant", icon: "🚒" },
  "selang-hydrant": { name: "INSPEKSI FUNGSI DAN SELANG HYDRANT", desc: "Cek tekanan air, coupling, nozzle", link: "selang-hydrant", key: "selang-hydrant", icon: "💧" },
  "fire-alarm": { name: "INSPEKSI FIRE ALARM", desc: "Pastikan sistem alarm kebakaran siap siaga", link: "fire-alarm", key: "fire-alarm", icon: "🔔" },
  "smoke-detector": { name: "INSPEKSI SMOKE DETECTOR", desc: "Cek fungsi smoke & heat detector", link: "smoke-detector", key: "smoke-detector", icon: "💨" },
  "apar": { name: "INSPEKSI APAR", desc: "Cek APAR: isi, kondisi, aksesibilitas", link: "inspeksi-apar", key: "apar", icon: "🧯" },
  "emergency-lamp": { name: "INSPEKSI EMERGENCY LAMP", desc: "Cek lampu darurat & exit lamp", link: "inspeksi-emergency", key: "emergency-lamp", icon: "🚨" },
  "exit-lamp-pintu-darurat": { name: "EXIT LAMP, PINTU DARURAT, DAN JALUR EVAKUASI", desc: "Cek pintu darurat & kejelasan jalur evakuasi", link: "exit-lamp-pintu-darurat", key: "exit-lamp-pintu-darurat", icon: "🚶" },
  
  // ⚙️ Kategori 2: Pemeliharaan Peralatan
  "lift-barang": { name: "PENGECEKAN LIFT BARANG DAILY", desc: "Cek harian lift barang: limit switch, tombol, kabin", link: "lift-barang", key: "lift-barang", icon: "🛗" },
  "inspeksi-preventif-lift-barang": { name: "INSPEKSI DAN PREVENTIF LIFT BARANG", desc: "Pemeliharaan preventif lift barang", link: "inspeksi-preventif-lift-barang", key: "inspeksi-preventif-lift-barang", icon: "🔧" },
  "tg-listrik": { name: "TANGGA LISTRIK (AWP)", desc: "Cek hidrolik, rem darurat, outrigger, kontrol keselamatan", link: "tg-listrik", key: "tg-listrik", icon: "🪜" },
  
  // ⚡ Kategori 3: Instalasi Listrik
  "panel": { name: "PANEL", desc: "Inspeksi panel listrik: suhu, bau, suara, grounding, ELCB", link: "panel", key: "panel", icon: "⚡" },
  "form-inspeksi-stop-kontak": { name: "FORM PENGECEKAN STOP KONTAK DAN INSTALASI LISTRIK", desc: "Cek stop kontak dan instalasi listrik di area kerja", link: "form-inspeksi-stop-kontak", key: "form-inspeksi-stop-kontak", icon: "🔌" },
  
  // 🦺 Kategori 4: Keselamatan Personal & Prasarana
  "e-checksheet-apd": { name: "Form pengambilan APD", desc: "Formulir distribusi & pengambilan APD", link: "e-checksheet-apd/riwayat-apd", key: "e-checksheet-apd", icon: "🦺" },
  "inf-jalan": { name: "INSPEKSI INFRASTUKTUR JALAN", desc: "Cek kondisi jalan, trotoar, boardess pabrik", link: "inf-jalan", key: "inf-jalan", icon: "🛣️" },
  "inspeksi-apd": { name: "INSPEKSI APD", desc: "Inspeksi pengecekan penggunaan APD", link: "inspeksi-apd", key: "inspeksi-apd", icon: "🔍" },
  
  // 🧹 Kategori 5: Kebersihan Fasilitas
  "checksheet-toilet": { name: "Checksheet Toilet", desc: "Patroli harian kebersihan toilet (standar 5S)", link: "checksheet-toilet", key: "checksheet-toilet", icon: "🚽" },
};

// ──────────────────────────────────────────────────────────────────────────────
// KATEGORI STRUCTURE - Grouping untuk display
// ──────────────────────────────────────────────────────────────────────────────
const CATEGORIES_STRUCTURE: Category[] = [
  {
    title: "1. Sistem Proteksi Kebakaran & Evakuasi",
    icon: "🔥",
    items: ["hydrant", "selang-hydrant", "fire-alarm", "smoke-detector", "apar", "emergency-lamp", "exit-lamp-pintu-darurat"]
      .map(key => ALL_CHECKSHEETS[key]).filter(Boolean) as ChecksheetItem[]
  },
  {
    title: "2. Keselamatan dan Pemeliharaan Peralatan",
    icon: "⚙️",
    items: ["lift-barang", "inspeksi-preventif-lift-barang", "tg-listrik"]
      .map(key => ALL_CHECKSHEETS[key]).filter(Boolean) as ChecksheetItem[]
  },
  {
    title: "3. Keselamatan dan Instalasi Listrik",
    icon: "⚡",
    items: ["panel", "form-inspeksi-stop-kontak"]
      .map(key => ALL_CHECKSHEETS[key]).filter(Boolean) as ChecksheetItem[]
  },
  {
    title: "4. Keselamatan Personal dan Prasarana Umum",
    icon: "🦺",
    items: ["e-checksheet-apd", "inf-jalan", "inspeksi-apd"]
      .map(key => ALL_CHECKSHEETS[key]).filter(Boolean) as ChecksheetItem[]
  },
  {
    title: "5. Kebersihan dan Kenyamanan Fasilitas",
    icon: "🧹",
    items: ["checksheet-toilet"]
      .map(key => ALL_CHECKSHEETS[key]).filter(Boolean) as ChecksheetItem[]
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// ROLE TO DEFAULT CATEGORY MAPPING (fallback jika user tidak punya checksheets spesifik)
// ──────────────────────────────────────────────────────────────────────────────
const ROLE_TO_DEFAULT_CATEGORY: Record<string, number | null> = {
  "inspector-ga-fire": 0,
  "inspector-ga-equipment": 1,
  "inspector-ga-electrical": 2,
  "inspector-ga-personal": 3,
  "inspector-ga-facility": 4,
  "inspector-ga": null,
  "admin": null,
  "superadmin": null,
};

export default function StatusGA() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    if (redirected) return;

    if (!user) {
      setRedirected(true);
      router.push("/login-page")
    } else if (!isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home")
    }
  }, [user, router, redirected])

  // ✅ FILTER CHECKSHEETS BERDASARKAN PERMISSION USER
  const displayedCategories = useMemo(() => {
    if (!user) return [];
    
    // ✅ Admin/Superadmin: lihat semua
    if (["admin", "superadmin"].includes(user.role)) {
      return CATEGORIES_STRUCTURE;
    }
    
    // ✅ Jika user punya checksheets spesifik, filter berdasarkan itu
    if (user.checksheets && user.checksheets.length > 0) {
      const permittedKeys = new Set(user.checksheets);
      
      // Filter categories yang memiliki item diizinkan
      return CATEGORIES_STRUCTURE
        .map(cat => ({
          ...cat,
          items: cat.items.filter(item => permittedKeys.has(item.key))
        }))
        .filter(cat => cat.items.length > 0); // Hanya tampilkan category yang tidak kosong
    }
    
    // ✅ Fallback: tampilkan category default berdasarkan role
    const defaultCategoryIndex = ROLE_TO_DEFAULT_CATEGORY[user.role];
    if (defaultCategoryIndex !== null && defaultCategoryIndex !== undefined) {
      return [CATEGORIES_STRUCTURE[defaultCategoryIndex]];
    }
    
    // Default: semua category (untuk legacy role)
    return CATEGORIES_STRUCTURE;
    
  }, [user]);

  if (!user) return null

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      "inspector-ga-fire": "🔥 Proteksi Kebakaran",
      "inspector-ga-equipment": "⚙️ Peralatan",
      "inspector-ga-electrical": "⚡ Listrik",
      "inspector-ga-personal": "🦺 Personal & Prasarana",
      "inspector-ga-facility": "🧹 Fasilitas",
      "admin": "👑 Administrator",
      "superadmin": "🌟 Super Administrator",
    };
    return labels[role] || "Inspector GA";
  };

  // Hitung total checksheet yang bisa diakses
  const totalAccessible = displayedCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  const totalAll = CATEGORIES_STRUCTURE.reduce((sum, cat) => sum + cat.items.length, 0);
  const hasPermission = user.checksheets && user.checksheets.length > 0;
  const isAdmin = ["admin", "superadmin"].includes(user.role);

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <main className="page-content">
        <header className="header">
          <div className="header-left">
            <h1 className="page-title">📋 Checklist General Affairs</h1>
            <span className="role-badge">Role: {getRoleLabel(user.role)}</span>
          </div>
          <div className="header-right">
            <span className="welcome-text">Selamat datang, <strong>{user.fullName}</strong></span>
            {!isAdmin && (
              <span className="access-count" title="Checksheet yang dapat diakses">
                📊 {totalAccessible} / {totalAll} checksheet
              </span>
            )}
          </div>
        </header>

        {/* Permission Info Banner - Tampilkan jika user punya permission spesifik */}
        {hasPermission && !isAdmin && (
          <div className="permission-banner" role="status">
            <div className="permission-banner-header">
              <span className="permission-banner-icon">🎯</span>
              <div className="permission-banner-content">
                <strong>Akses Terbatas Aktif</strong>
                <p>
                  Anda memiliki akses ke <strong>{totalAccessible} checksheet</strong> dari total {totalAll} checksheet yang tersedia.
                  Hanya checksheet yang diizinkan oleh admin yang akan ditampilkan.
                </p>
              </div>
            </div>
            <details className="permission-details">
              <summary>
                <span>Lihat daftar checksheet yang diizinkan ({totalAccessible})</span>
                <svg className="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div className="permitted-grid">
                {user.checksheets?.map(key => {
                  const item = ALL_CHECKSHEETS[key];
                  return item ? (
                    <div key={key} className="permitted-item">
                      <span className="permitted-icon">{item.icon}</span>
                      <div className="permitted-info">
                        <strong>{item.name}</strong>
                        <small>{item.desc}</small>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </details>
          </div>
        )}

        {/* Admin Banner */}
        {isAdmin && (
          <div className="admin-banner" role="status">
            <span className="admin-banner-icon">👑</span>
            <div className="admin-banner-content">
              <strong>Akses Administrator</strong>
              <p>Anda memiliki akses penuh ke semua {totalAll} checksheet.</p>
            </div>
          </div>
        )}

        <div className="ga-checklist-container">
          {displayedCategories.length > 0 ? (
            displayedCategories.map((cat, catIndex) => (
              <section key={catIndex} className="category-section" aria-labelledby={`cat-title-${catIndex}`}>
                <h2 id={`cat-title-${catIndex}`} className="category-title">
                  <span className="category-icon">{cat.icon}</span>
                  {cat.title}
                  <span className="category-count">{cat.items.length} checksheet</span>
                </h2>
                <div className="checklist-grid">
                  {cat.items.map((item, itemIdx) => (
                    <Link 
                      key={`${catIndex}-${itemIdx}-${item.key}`} 
                      href={`/status-ga/${item.link}`} 
                      className="checklist-card"
                      aria-label={`${item.name}: ${item.desc}`}
                    >
                      <div className="card-header">
                        <span className="card-icon" aria-hidden="true">{item.icon}</span>
                        <h3 className="card-title">{item.name}</h3>
                      </div>
                      <p className="card-desc">{item.desc}</p>
                      <span className="card-action" aria-hidden="true">
                        <svg className="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </span>
                    </Link> 
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="empty-state" role="alert">
              <div className="empty-icon">🔒</div>
              <h3>Tidak Ada Akses Checksheet</h3>
              <p>Anda belum memiliki akses ke checksheet apa pun.</p>
              <p className="empty-sub">Hubungi administrator untuk pengaturan permission melalui halaman registrasi.</p>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        /* ── Base Styles ── */
        :global(.app-page) { display: flex; min-height: 100vh; width: 100%; }
        .page-content { 
          flex: 1; 
          width: 100%; 
          min-width: 0; 
          padding: 12px; 
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
          display: flex; 
          flex-direction: column; 
          align-items: stretch; 
        }
        
        /* ── Header ── */
        .header { 
          display: flex; 
          flex-direction: column; 
          gap: 12px; 
          padding: 14px; 
          background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%); 
          border-radius: 12px; 
          margin-bottom: 16px; 
        }
        .header-left { display: flex; flex-direction: column; gap: 8px; }
        .header-right { display: flex; flex-direction: column; gap: 10px; align-items: stretch; }
        .page-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: white; line-height: 1.3; word-break: break-word; }
        .role-badge { 
          display: inline-flex; 
          align-items: center; 
          background: rgba(255, 255, 255, 0.2); 
          color: white; 
          padding: 4px 12px; 
          border-radius: 20px; 
          font-size: 0.75rem; 
          font-weight: 500; 
          width: fit-content; 
        }
        .welcome-text { font-size: 0.9rem; color: white; opacity: 0.95; text-align: center; }
        .welcome-text strong { font-weight: 600; }
        
        /* ── Access Count Badge ── */
        .access-count {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* ── Permission Banner ── */
        .permission-banner {
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          border-left: 4px solid #f97316;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.1);
        }
        .permission-banner-header {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .permission-banner-icon { 
          font-size: 1.5rem; 
          line-height: 1;
          flex-shrink: 0;
        }
        .permission-banner-content {
          flex: 1;
        }
        .permission-banner-content strong {
          display: block;
          color: #c2410c;
          font-size: 1rem;
          margin-bottom: 4px;
        }
        .permission-banner-content p { 
          margin: 0; 
          line-height: 1.5;
          color: #9a3412;
          font-size: 0.9rem;
        }
        .permission-banner-content strong {
          color: #c2410c;
        }
        
        .permission-details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #fdba74;
        }
        .permission-details summary {
          cursor: pointer;
          color: #c2410c;
          font-weight: 600;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(249, 115, 22, 0.1);
          border-radius: 8px;
          transition: all 0.2s;
        }
        .permission-details summary:hover {
          background: rgba(249, 115, 22, 0.15);
        }
        .permission-details summary span {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chevron-icon {
          transition: transform 0.2s;
        }
        .permission-details[open] .chevron-icon {
          transform: rotate(180deg);
        }
        
        .permitted-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 8px;
        }
        .permitted-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: white;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .permitted-item:hover {
          border-color: #f97316;
          box-shadow: 0 2px 6px rgba(249, 115, 22, 0.1);
        }
        .permitted-icon {
          font-size: 1.3rem;
          flex-shrink: 0;
        }
        .permitted-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .permitted-info strong {
          font-size: 0.85rem;
          color: #1e293b;
          line-height: 1.3;
        }
        .permitted-info small {
          font-size: 0.75rem;
          color: #64748b;
          line-height: 1.3;
        }

        /* ── Admin Banner ── */
        .admin-banner {
          display: flex;
          gap: 12px;
          align-items: center;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-left: 4px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
        }
        .admin-banner-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        .admin-banner-content strong {
          display: block;
          color: #92400e;
          font-size: 1rem;
          margin-bottom: 4px;
        }
        .admin-banner-content p {
          margin: 0;
          color: #78350f;
          font-size: 0.9rem;
        }

        /* ── Checklist Container & Cards ── */
        .ga-checklist-container { display: flex; flex-direction: column; gap: 16px; width: 100%; }
        .category-section { 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); 
          padding: 14px 12px; 
          border-left: 4px solid #1e88e5; 
        }
        .category-title { 
          margin: 0 0 12px; 
          color: #0d47a1; 
          font-size: 1rem; 
          font-weight: 700; 
          border-bottom: 2px solid #e3f2fd; 
          padding-bottom: 10px; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          line-height: 1.3; 
          flex-wrap: wrap;
        }
        .category-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .category-count {
          margin-left: auto;
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748b;
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 12px;
        }
        .checklist-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .checklist-card { 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          text-decoration: none; 
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); 
          border: 2px solid #e8eef7; 
          border-radius: 10px; 
          padding: 12px; 
          transition: all 0.2s ease; 
          position: relative; 
          overflow: hidden; 
          min-height: 90px; 
        }
        .checklist-card:hover { 
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); 
          border-color: #1e88e5; 
          transform: translateY(-2px); 
          box-shadow: 0 4px 16px rgba(30, 136, 229, 0.15); 
        }
        .card-header { 
          display: flex; 
          align-items: flex-start; 
          gap: 8px; 
          margin-bottom: 6px; 
          min-width: 0; 
        }
        .card-icon { 
          font-size: 1.3rem; 
          flex-shrink: 0; 
          line-height: 1; 
        }
        .card-title { 
          font-size: 0.9rem; 
          color: #1a237e; 
          font-weight: 700; 
          line-height: 1.3; 
          word-break: break-word; 
          overflow-wrap: break-word; 
          margin: 0; 
          flex: 1; 
          min-width: 0; 
        }
        .card-desc { 
          font-size: 0.75rem; 
          color: #666; 
          line-height: 1.4; 
          margin: 0 0 8px 32px; 
          word-break: break-word; 
          overflow-wrap: break-word; 
        }
        .card-action { 
          display: flex; 
          justify-content: flex-end; 
          margin-left: 32px; 
          margin-top: auto; 
        }
        .arrow-icon { 
          color: #1e88e5; 
          opacity: 0.7; 
          transition: all 0.2s ease; 
          flex-shrink: 0; 
        }
        .checklist-card:hover .arrow-icon { 
          opacity: 1; 
          transform: translateX(2px); 
        }

        /* ── Empty State ── */
        .empty-state { 
          text-align: center; 
          padding: 48px 24px; 
          background: white; 
          border-radius: 12px; 
          border: 2px dashed #cbd5e1; 
          color: #64748b; 
        }
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .empty-state h3 {
          margin: 0 0 8px;
          color: #334155;
          font-size: 1.2rem;
        }
        .empty-state p { 
          margin: 8px 0; 
          font-size: 0.95rem; 
        }
        .empty-sub { 
          font-size: 0.85rem; 
          color: #94a3b8; 
        }

        /* ── Responsive ── */
        @media (min-width: 480px) {
          .page-content { padding: 16px; }
          .header { 
            flex-direction: row; 
            align-items: center; 
            justify-content: space-between; 
            gap: 12px; 
            padding: 16px; 
          }
          .header-left { flex: 1; min-width: 0; }
          .header-right { 
            flex-direction: row; 
            align-items: center; 
            justify-content: flex-end; 
            gap: 12px; 
            flex-wrap: wrap; 
          }
          .page-title { font-size: 1.35rem; }
          .welcome-text { text-align: right; font-size: 0.9rem; }
          .access-count { font-size: 0.8rem; padding: 6px 14px; }
          .category-section { padding: 18px 16px; border-radius: 14px; }
          .category-title { font-size: 1.1rem; margin-bottom: 14px; }
          .checklist-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
          .checklist-card { padding: 14px; min-height: 100px; border-radius: 12px; }
          .card-title { font-size: 0.95rem; }
          .card-desc { font-size: 0.8rem; margin-left: 36px; }
          .card-icon { font-size: 1.4rem; }
          .permitted-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
        }
        
        @media (min-width: 768px) {
          .page-content { margin-left: 72px; padding: 20px 24px; }
          :global(body.sidebar-expanded) .page-content { margin-left: 240px; }
          .header { padding: 20px 24px; margin-bottom: 24px; border-radius: 14px; }
          .page-title { font-size: 1.5rem; }
          .welcome-text { font-size: 0.95rem; }
          .ga-checklist-container { gap: 24px; }
          .category-section { padding: 24px 20px; border-radius: 16px; border-left-width: 5px; }
          .category-title { font-size: 1.25rem; margin-bottom: 18px; padding-bottom: 12px; }
          .checklist-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
          .checklist-card { padding: 16px; min-height: 110px; border-radius: 14px; }
          .card-header { gap: 10px; }
          .card-title { font-size: 1rem; }
          .card-desc { font-size: 0.85rem; margin-left: 40px; }
          .card-icon { font-size: 1.5rem; }
          .arrow-icon { opacity: 0; transform: translateX(-4px); }
          .checklist-card:hover .arrow-icon { opacity: 1; transform: translateX(0); }
          .permitted-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
        }
        
        @media (min-width: 1024px) {
          .page-content { padding: 28px 32px; }
          .header { padding: 24px 32px; margin-bottom: 32px; border-radius: 16px; }
          .page-title { font-size: 1.65rem; }
          .welcome-text { font-size: 1rem; }
          .category-section { padding: 28px 24px; }
          .category-title { font-size: 1.4rem; }
          .checklist-grid { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
          .checklist-card { padding: 20px; min-height: 120px; }
          .card-title { font-size: 1.05rem; }
          .card-desc { font-size: 0.9rem; }
          .card-icon { font-size: 1.6rem; }
          .permitted-grid { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
        }
        
        @media (min-width: 1400px) {
          .page-content { max-width: 1400px; margin: 0 auto 0 72px; padding: 32px 40px; }
          :global(body.sidebar-expanded) .page-content { margin-left: 240px; }
          .checklist-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
          .category-section { padding: 32px 28px; }
          .category-title { font-size: 1.5rem; }
          .permitted-grid { grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }
        }
        
        *, *::before, *::after { box-sizing: border-box; }
        img, svg, video { max-width: 100%; height: auto; display: block; }
        html, body { overflow-x: hidden; width: 100%; min-width: 0; }
        .checklist-card:focus-visible { outline: 3px solid #1e88e5; outline-offset: 2px; }
        html { scroll-behavior: smooth; }
        .card-icon, .arrow-icon { user-select: none; }
      `}</style>
    </div>
  )
}