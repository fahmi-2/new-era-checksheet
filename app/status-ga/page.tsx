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
// MASTER CHECKSHEET DATABASE
// ──────────────────────────────────────────────────────────────────────────────
const ALL_CHECKSHEETS: Record<string, ChecksheetItem> = {
  "hydrant": { name: "INSPEKSI HYDRANT", desc: "Cek kondisi fisik dan fungsional hidran", link: "inspeksi-hydrant", key: "hydrant", icon: "🚒" },
  "selang-hydrant": { name: "INSPEKSI FUNGSI DAN SELANG HYDRANT", desc: "Cek tekanan air, coupling, nozzle", link: "selang-hydrant", key: "selang-hydrant", icon: "💧" },
  "fire-alarm": { name: "INSPEKSI FIRE ALARM", desc: "Pastikan sistem alarm kebakaran siap siaga", link: "fire-alarm", key: "fire-alarm", icon: "🔔" },
  "smoke-detector": { name: "INSPEKSI SMOKE DETECTOR", desc: "Cek fungsi smoke & heat detector", link: "smoke-detector", key: "smoke-detector", icon: "💨" },
  "apar": { name: "INSPEKSI APAR", desc: "Cek APAR: isi, kondisi, aksesibilitas", link: "inspeksi-apar", key: "apar", icon: "🧯" },
  "emergency-lamp": { name: "INSPEKSI EMERGENCY LAMP", desc: "Cek lampu darurat & exit lamp", link: "inspeksi-emergency", key: "emergency-lamp", icon: "🚨" },
  "exit-lamp-pintu-darurat": { name: "EXIT LAMP, PINTU DARURAT, DAN JALUR EVAKUASI", desc: "Cek pintu darurat & kejelasan jalur evakuasi", link: "exit-lamp-pintu-darurat", key: "exit-lamp-pintu-darurat", icon: "🚶" },
  "lift-barang": { name: "PENGECEKAN LIFT BARANG DAILY", desc: "Cek harian lift barang: limit switch, tombol, kabin", link: "lift-barang", key: "lift-barang", icon: "🛗" },
  "inspeksi-preventif-lift-barang": { name: "INSPEKSI DAN PREVENTIF LIFT BARANG", desc: "Pemeliharaan preventif lift barang", link: "inspeksi-preventif-lift-barang", key: "inspeksi-preventif-lift-barang", icon: "🔧" },
  "tg-listrik": { name: "TANGGA LISTRIK (AWP)", desc: "Cek hidrolik, rem darurat, outrigger, kontrol keselamatan", link: "tg-listrik", key: "tg-listrik", icon: "🪜" },
  "panel": { name: "PANEL", desc: "Inspeksi panel listrik: suhu, bau, suara, grounding, ELCB", link: "e-checksheet-panel", key: "panel", icon: "⚡" },
  "form-inspeksi-stop-kontak": { name: "FORM PENGECEKAN STOP KONTAK DAN INSTALASI LISTRIK", desc: "Cek stop kontak dan instalasi listrik di area kerja", link: "form-inspeksi-stop-kontak", key: "form-inspeksi-stop-kontak", icon: "🔌" },
  "e-checksheet-apd": { name: "Form pengambilan APD", desc: "Formulir distribusi & pengambilan APD", link: "e-checksheet-apd/riwayat-apd", key: "e-checksheet-apd", icon: "🦺" },
  "inf-jalan": { name: "INSPEKSI INFRASTUKTUR JALAN", desc: "Cek kondisi jalan, trotoar, boardess pabrik", link: "inf-jalan", key: "inf-jalan", icon: "🛣️" },
  "inspeksi-apd": { name: "INSPEKSI APD", desc: "Inspeksi pengecekan penggunaan APD", link: "e-checksheet-ins-apd", key: "inspeksi-apd", icon: "🔍" },
  "checksheet-toilet": { name: "Checksheet Toilet", desc: "Patroli harian kebersihan toilet (standar 5S)", link: "checksheet-toilet", key: "checksheet-toilet", icon: "🚽" },
}

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
]

const ROLE_TO_DEFAULT_CATEGORY: Record<string, number | null> = {
  "inspector-ga-fire": 0, "inspector-ga-equipment": 1, "inspector-ga-electrical": 2,
  "inspector-ga-personal": 3, "inspector-ga-facility": 4, "inspector-ga": null,
  "admin": null, "superadmin": null,
}

export default function StatusGA() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    if (redirected) return
    if (!user) {
      setRedirected(true)
      router.push("/login-page")
    } else if (!isAuthorizedForChecksheet(user)) {
      setRedirected(true)
      router.push("/home")
    }
  }, [user, router, redirected])

  const displayedCategories = useMemo(() => {
    if (!user) return []
    if (["admin", "superadmin"].includes(user.role)) return CATEGORIES_STRUCTURE

    if (user.checksheets && user.checksheets.length > 0) {
      const permittedKeys = new Set(user.checksheets)
      return CATEGORIES_STRUCTURE
        .map(cat => ({ ...cat, items: cat.items.filter(item => permittedKeys.has(item.key)) }))
        .filter(cat => cat.items.length > 0)
    }

    const defaultCategoryIndex = ROLE_TO_DEFAULT_CATEGORY[user.role]
    if (defaultCategoryIndex !== null && defaultCategoryIndex !== undefined) {
      return [CATEGORIES_STRUCTURE[defaultCategoryIndex]]
    }
    return CATEGORIES_STRUCTURE
  }, [user])

  if (!user) return null

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      "inspector-ga-fire": "🔥 Proteksi Kebakaran", "inspector-ga-equipment": "⚙️ Peralatan",
      "inspector-ga-electrical": "⚡ Listrik", "inspector-ga-personal": "🦺 Personal & Prasarana",
      "inspector-ga-facility": "🧹 Fasilitas", "admin": "👑 Administrator", "superadmin": "🌟 Super Administrator",
    }
    return labels[role] || "Inspector GA"
  }

  const totalAccessible = displayedCategories.reduce((sum, cat) => sum + cat.items.length, 0)
  const totalAll = CATEGORIES_STRUCTURE.reduce((sum, cat) => sum + cat.items.length, 0)
  const hasPermission = user.checksheets && user.checksheets.length > 0
  const isAdmin = ["admin", "superadmin"].includes(user.role)

  return (
    <div className="ga-app-shell">
      <Sidebar userName={user.fullName} />
      <main className="ga-main">
        {/* Header */}
        <header className="ga-hero">
          <div className="ga-hero-content">
            <p className="ga-eyebrow">📋 General Affairs</p>
            <h1>Checklist Operasional</h1>
            <p className="ga-subtitle">Pilih checksheet untuk mulai pemeriksaan. Data tersimpan sesuai area dan tanggal.</p>
          </div>
          <div className="ga-hero-meta">
            <span className="ga-role-badge">{getRoleLabel(user.role)}</span>
            {!isAdmin && <span className="ga-count-badge">{totalAccessible} / {totalAll} Akses</span>}
          </div>
        </header>

        {/* Banners */}
        {hasPermission && !isAdmin && (
          <div className="ga-notice ga-notice-warning">
            <div className="ga-notice-icon">🎯</div>
            <div className="ga-notice-content">
              <strong>Akses Terbatas Aktif</strong>
              <p>Anda memiliki akses ke <strong>{totalAccessible} checksheet</strong>. Hanya checksheet yang diizinkan admin yang ditampilkan.</p>
              <details className="ga-details">
                <summary>Lihat daftar checksheet yang diizinkan</summary>
                <div className="ga-permitted-grid">
                  {user.checksheets?.map(key => {
                    const item = ALL_CHECKSHEETS[key]
                    return item ? (
                      <div key={key} className="ga-permitted-item">
                        <span>{item.icon}</span>
                        <div><strong>{item.name}</strong><small>{item.desc}</small></div>
                      </div>
                    ) : null
                  })}
                </div>
              </details>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="ga-notice ga-notice-info">
            <div className="ga-notice-icon">👑</div>
            <div className="ga-notice-content">
              <strong>Akses Administrator</strong>
              <p>Anda memiliki akses penuh ke semua {totalAll} checksheet yang tersedia.</p>
            </div>
          </div>
        )}

        {/* Categories & Cards */}
        <div className="ga-groups">
          {displayedCategories.length > 0 ? (
            displayedCategories.map((cat, catIndex) => (
              <section key={catIndex} className="ga-group">
                <div className="ga-group-heading">
                  <div className="ga-group-title">
                    <span className="ga-group-icon">{cat.icon}</span>
                    <h2>{cat.title}</h2>
                  </div>
                  <span className="ga-group-count">{cat.items.length}</span>
                </div>
                <div className="ga-card-grid">
                  {cat.items.map((item, itemIdx) => (
                    <Link
                      key={`${catIndex}-${itemIdx}-${item.key}`}
                      href={
                        item.key === "inspeksi-apd"
                          ? "/e-checksheet-ins-apd"
                          : item.key === "panel"
                          ? "/e-checksheet-panel"
                          : `/status-ga/${item.link}`
                      }
                      className="ga-check-card"
                    >
                      <div className="ga-card-icon">{item.icon}</div>
                      <div className="ga-card-copy">
                        <h3>{item.name}</h3>
                        <p>{item.desc}</p>
                      </div>
                      <svg className="ga-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="ga-empty">
              <div className="ga-empty-icon">🔒</div>
              <h2>Tidak Ada Akses Checksheet</h2>
              <p>Hubungi administrator untuk pengaturan permission melalui halaman registrasi.</p>
            </div>
          )}
        </div>
      </main>

      <style>{`
        /* ── Base Layout & Sidebar Sync ── */
        .ga-app-shell { display: flex; min-height: 100vh; background: #f5f7fa; }
        .ga-main { 
          flex: 1; 
          margin-left: var(--sidebar-w, 70px); 
          padding: 2rem; 
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 0; 
        }
        :global(.sidebar-container.collapsed) ~ .ga-main { margin-left: 70px; }
        :global(.sidebar-container.expanded) ~ .ga-main { margin-left: 240px; }

        /* ── Hero Header ── */
        .ga-hero { 
          display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem;
          margin-bottom: 2rem; padding: 2.25rem 2rem; 
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%); 
          color: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(30, 64, 175, 0.22); 
          border: 1px solid rgba(255, 255, 255, 0.15);
          position: relative;
          overflow: hidden;
        }
        .ga-eyebrow { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #93c5fd; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .ga-hero h1 { font-size: 2rem; font-weight: 800; color: #ffffff; margin: 0 0 0.5rem 0; letter-spacing: -0.02em; }
        .ga-subtitle { color: #e2e8f0; font-size: 0.95rem; line-height: 1.6; margin: 0; max-width: 620px; }
        .ga-hero-meta { display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-end; flex-shrink: 0; }
        .ga-role-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1.1rem; background: rgba(255, 255, 255, 0.15); color: #ffffff; border-radius: 999px; font-size: 0.875rem; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.25); backdrop-filter: blur(8px); }
        .ga-count-badge { display: inline-flex; align-items: center; padding: 0.5rem 1.1rem; background: rgba(0, 0, 0, 0.25); color: #93c5fd; border-radius: 999px; font-size: 0.875rem; font-weight: 700; border: 1px solid rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); }

        /* ── Notice Banners ── */
        .ga-notice { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; border-radius: 10px; margin-bottom: 1.5rem; border: 1px solid; }
        .ga-notice-warning { background: #fff7ed; border-color: #fed7aa; }
        .ga-notice-info { background: #eff6ff; border-color: #bfdbfe; }
        .ga-notice-icon { font-size: 1.5rem; flex-shrink: 0; line-height: 1; }
        .ga-notice-content { flex: 1; }
        .ga-notice-content strong { display: block; font-size: 1rem; margin-bottom: 0.25rem; }
        .ga-notice-warning .ga-notice-content strong { color: #c2410c; }
        .ga-notice-info .ga-notice-content strong { color: #1d4ed8; }
        .ga-notice-content p { margin: 0; font-size: 0.9rem; line-height: 1.5; }
        .ga-notice-warning .ga-notice-content p { color: #9a3412; }
        .ga-notice-info .ga-notice-content p { color: #1e40af; }

        /* Details Dropdown */
        .ga-details { margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed currentColor; opacity: 0.8; }
        .ga-details summary { cursor: pointer; font-weight: 600; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; transition: opacity 0.2s; }
        .ga-details summary:hover { opacity: 0.7; }
        .ga-permitted-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
        .ga-permitted-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.7); border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); }
        .ga-permitted-item strong { display: block; font-size: 0.85rem; color: #0f172a; }
        .ga-permitted-item small { font-size: 0.75rem; color: #64748b; }

        /* ── Groups & Cards ── */
        .ga-groups { display: flex; flex-direction: column; gap: 2rem; }
        .ga-group { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
        .ga-group-heading { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 1.5rem; 
          padding: 1rem 1.25rem; 
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); 
          border-radius: 10px;
          color: white;
          box-shadow: 0 4px 14px rgba(30, 64, 175, 0.2);
        }
        .ga-group-title { display: flex; align-items: center; gap: 0.75rem; margin: 0; }
        .ga-group-icon { 
          font-size: 1.35rem; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          width: 2.5rem; 
          height: 2.5rem; 
          background: rgba(255, 255, 255, 0.2); 
          border-radius: 8px;
          backdrop-filter: blur(4px);
        }
        .ga-group-title h2 { font-size: 1.15rem; font-weight: 700; color: #ffffff; margin: 0; }
        .ga-group-count { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          min-width: 2.5rem; 
          height: 2.5rem; 
          padding: 0 0.75rem;
          background: rgba(255, 255, 255, 0.22); 
          border-radius: 8px; 
          font-weight: 700; 
          color: #ffffff; 
          font-size: 0.9rem; 
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
        }

        .ga-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .ga-check-card { 
          display: flex; align-items: center; gap: 1rem; padding: 1.25rem; 
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; 
          text-decoration: none; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .ga-check-card:hover { 
          background: white; border-color: #3b82f6; 
          transform: translateY(-3px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.12); 
        }
        .ga-card-icon { font-size: 1.5rem; flex-shrink: 0; width: 3rem; height: 3rem; display: flex; align-items: center; justify-content: center; background: white; border-radius: 8px; border: 1px solid #e2e8f0; }
        .ga-check-card:hover .ga-card-icon { border-color: #3b82f6; background: #eff6ff; }
        .ga-card-copy { flex: 1; min-width: 0; }
        .ga-card-copy h3 { font-size: 0.95rem; font-weight: 700; color: #1e40af; margin: 0 0 0.25rem 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.2s ease; }
        .ga-check-card:hover .ga-card-copy h3 { color: #2563eb; }
        .ga-card-copy p { font-size: 0.8rem; color: #64748b; line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .ga-card-arrow { color: #94a3b8; flex-shrink: 0; transition: all 0.25s ease; }
        .ga-check-card:hover .ga-card-arrow { color: #3b82f6; transform: translateX(4px); }

        /* ── Empty State ── */
        .ga-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; background: white; border-radius: 12px; border: 2px dashed #cbd5e1; }
        .ga-empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
        .ga-empty h2 { font-size: 1.25rem; color: #334155; margin: 0 0 0.5rem 0; }
        .ga-empty p { color: #64748b; font-size: 0.95rem; margin: 0; }

        /* ── Responsive Breakpoints ── */
        @media (max-width: 1024px) {
          .ga-main { margin-left: var(--sidebar-w, 70px); padding: 1.5rem; }
          .ga-hero { flex-direction: column; gap: 1.5rem; }
          .ga-hero-meta { align-items: flex-start; flex-direction: row; }
          .ga-card-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
        }

        @media (max-width: 768px) {
          .ga-app-shell { flex-direction: column; }
          .ga-main { margin-left: 0 !important; padding: 1rem; width: 100%; }
          .ga-hero { padding: 1.5rem; }
          .ga-hero h1 { font-size: 1.5rem; }
          .ga-card-grid { grid-template-columns: 1fr; }
          .ga-group { padding: 1.25rem; }
          .ga-group-heading { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
          .ga-permitted-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .ga-main { padding: 0.75rem; }
          .ga-hero { padding: 1.25rem; }
          .ga-hero h1 { font-size: 1.25rem; }
          .ga-subtitle { font-size: 0.85rem; }
          .ga-check-card { padding: 1rem; }
          .ga-card-icon { width: 2.5rem; height: 2.5rem; font-size: 1.25rem; }
          .ga-card-copy h3 { font-size: 0.9rem; }
        }
      `}</style>
    </div>
  )
}