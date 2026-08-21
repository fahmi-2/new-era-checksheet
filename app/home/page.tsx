// app/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Flame,
  Wrench,
  Zap,
  UserCheck,
  Building2,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/auth-context";

interface CardData {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  href: string;
  category?: number;
}

interface ActivityItem {
  title: string;
  user: string;
  time: string;
  status: "OK" | "NG";
}

// ─────────────────────────────────────────────────────────────
// HOOK: useSidebarWidth
// ─────────────────────────────────────────────────────────────
function useSidebarWidth(isMobile: boolean) {
  const COLLAPSED_W = 70;
  const EXPANDED_W = 240;
  const [sidebarW, setSidebarW] = useState(COLLAPSED_W);

  useEffect(() => {
    if (isMobile) {
      setSidebarW(0);
      return;
    }

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
  }, [isMobile]);

  return sidebarW;
}

// ─────────────────────────────────────────────────────────────
// TYPE GUARDS - Helper functions untuk type checking
// ─────────────────────────────────────────────────────────────
function isAdminRole(role: Role | undefined): role is "admin" | "superadmin" {
  return role === "admin" || role === "superadmin";
}

function isInspectorGARole(role: Role | undefined): role is 
  | "inspector-ga-fire"
  | "inspector-ga-equipment"
  | "inspector-ga-electrical"
  | "inspector-ga-personal"
  | "inspector-ga-facility" {
  return role?.startsWith("inspector-ga-") ?? false;
}

// ─────────────────────────────────────────────────────────────
// ROLE CONFIGURATION
// ─────────────────────────────────────────────────────────────
const GA_ROLE_CONFIG: Record<string, { 
  title: string; 
  desc: string; 
  icon: LucideIcon; 
  gradient: string; 
  categoryIndex: number;
}> = {
  "inspector-ga-fire": {
    title: "🔥 Proteksi Kebakaran",
    desc: "Hydrant, Fire Alarm, APAR, Smoke Detector, Emergency Lamp",
    icon: Flame,
    gradient: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
    categoryIndex: 0,
  },
  "inspector-ga-equipment": {
    title: "⚙️ Pemeliharaan Peralatan",
    desc: "Lift Barang Daily, Preventif Lift, Tangga Listrik (AWP)",
    icon: Wrench,
    gradient: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    categoryIndex: 1,
  },
  "inspector-ga-electrical": {
    title: "⚡ Instalasi Listrik",
    desc: "Panel Listrik, Stop Kontak, Instalasi Area Kerja",
    icon: Zap,
    gradient: "linear-gradient(135deg, #f59e0b 0%, #eab308 100%)",
    categoryIndex: 2,
  },
  "inspector-ga-personal": {
    title: "🦺 Keselamatan Personal",
    desc: "Form APD, Inspeksi APD, Infrastruktur Jalan",
    icon: UserCheck,
    gradient: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
    categoryIndex: 3,
  },
  "inspector-ga-facility": {
    title: "🧹 Kebersihan Fasilitas",
    desc: "Checksheet Toilet, Patroli Kebersihan 5S",
    icon: Building2,
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
    categoryIndex: 4,
  },
};

export default function ModernHomePage() {
  const { user, loading } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const sidebarWidth = useSidebarWidth(isMobile);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    let shouldUpdate = true;

    try {
      const historyStr = localStorage.getItem("checksheet_history");
      if (!historyStr) {
        if (shouldUpdate) setActivities([]);
        return;
      }

      const history = JSON.parse(historyStr);
      if (!Array.isArray(history)) {
        if (shouldUpdate) setActivities([]);
        return;
      }

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const todayEntries = history.filter((item: any) => {
        const filledDate = new Date(item.filledAt);
        return filledDate >= todayStart && filledDate < todayEnd;
      });

      const sorted = [...todayEntries].sort(
        (a: any, b: any) => new Date(b.filledAt).getTime() - new Date(a.filledAt).getTime()
      );

      const recent = sorted.slice(0, 3).map((item: any) => ({
        title: String(item.area || "Checklist"),
        user: String(item.filledBy || "Unknown"),
        time: new Date(item.filledAt).toLocaleString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: (item.status === "NG" ? "NG" : "OK") as "OK" | "NG",
      }));

      if (shouldUpdate) setActivities(recent);
    } catch (e) {
      console.error("[Home] Gagal memuat riwayat:", e);
      if (shouldUpdate) setActivities([]);
    }

    return () => { shouldUpdate = false; };
  }, [isMounted]);

  if (!isMounted) return null;
  if (loading) {
    return (
      <div className="modern-home-page">
        <Sidebar userName="Loading..." />
        <main className="main-content" style={{ marginLeft: 0 }}>
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            Memuat dashboard...
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const userName = user.fullName || "User";
  const currentRole = user.role;

  // ─────────────────────────────────────────────────────────────
  // LOGIC SAPAAN BERDASARKAN ROLE
  // ─────────────────────────────────────────────────────────────
  const rolePrefix = isAdminRole(currentRole)
    ? "Admin"
    : currentRole?.toLowerCase().includes("inspector")
    ? "Inspector"
    : "";
    
  const greeting = rolePrefix ? `Halo, ${rolePrefix} ${userName}!` : `Halo, ${userName}!`;

  // ─────────────────────────────────────────────────────────────
  // BUILD CARDS BERDASARKAN ROLE - Menggunakan Type Guards
  // ─────────────────────────────────────────────────────────────
  const getRoleCards = (): CardData[] => {
    // ✅ Admin: lihat semua + dashboard
    if (isAdminRole(currentRole)) {
      return [
        {
          id: "ga-dashboard",
          icon: LayoutDashboard,
          title: "📊 Dashboard Admin",
          description: "Kelola user, lihat statistik sistem, dan laporan lengkap",
          gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          href: "/ga-dashboard",
        },
        {
          id: "all-checklists",
          icon: ShieldCheck,
          title: "📋 Semua Checklist GA",
          description: "Akses semua kategori checksheet General Affairs",
          gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
          href: "/status-ga",
        },
      ];
    }

    // ✅ 5 Inspector GA Roles
    if (isInspectorGARole(currentRole)) {
      const config = GA_ROLE_CONFIG[currentRole];
      if (config) {
        return [
          {
            id: `checklist-${config.categoryIndex}`,
            icon: config.icon,
            title: config.title,
            description: config.desc,
            gradient: config.gradient,
            href: `/status-ga?category=${config.categoryIndex}`,
            category: config.categoryIndex,
          },
        ];
      }
    }

    // ✅ Fallback untuk role lain
    return [
      {
        id: "checklist-ga",
        icon: Building2,
        title: "📋 Checklist GA",
        description: "Kebersihan, keamanan, dan fasilitas General Affairs",
        gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        href: "/status-ga",
      },
    ];
  };

  const currentRoleCards = getRoleCards();

  const mainContentStyle: React.CSSProperties = {
    marginLeft: isMobile ? 0 : sidebarWidth,
    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    paddingTop: isMobile ? "60px" : "20px",
    paddingLeft: "36px",
    paddingRight: "25px",
  };

  return (
    <div className="modern-home-page">
      <Sidebar userName={userName} />

      <main className="main-content" style={mainContentStyle}>
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="welcome-content">
            <h1 className="welcome-title">👋 {greeting}</h1>
            <p className="welcome-text">
              {isInspectorGARole(currentRole) && GA_ROLE_CONFIG[currentRole]
                ? `Anda ditugaskan untuk kategori: ${GA_ROLE_CONFIG[currentRole].title}`
                : "Kelola checklist dan laporan General Affairs Anda dengan mudah."
              }
            </p>
          </div>
          <div className="welcome-illustration" aria-hidden="true">
            <svg width="160" height="120" viewBox="0 0 200 150" fill="none">
              <circle cx="100" cy="75" r="60" fill="#fcfcfc" opacity="0.5" />
              <circle cx="100" cy="75" r="40" fill="#006afe" opacity="0.3" />
              <path
                d="M80 75L95 90L120 60"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Role Info Banner */}
        {isInspectorGARole(currentRole) && GA_ROLE_CONFIG[currentRole] && (
          <div className="role-info-banner">
            <span className="role-icon">📋</span>
            <div>
              <strong>{GA_ROLE_CONFIG[currentRole].title}</strong>
              <p>{GA_ROLE_CONFIG[currentRole].desc}</p>
            </div>
            <span className="category-badge">
              Kategori {GA_ROLE_CONFIG[currentRole].categoryIndex + 1}
            </span>
          </div>
        )}

        {/* Main Cards */}
        <section className="section">
          <div className="section-header">
            <div>
              <h2 className="section-title">📋 Menu Utama</h2>
              <p className="section-desc">
                {isAdminRole(currentRole)
                  ? "Akses dashboard dan semua checklist General Affairs"
                  : "Mulai inspeksi untuk area tanggung jawab Anda"
                }
              </p>
            </div>
          </div>
          
          <div className="cards-grid">
            {currentRoleCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.id} href={card.href} className="feature-card-link">
                  <div className="feature-card" style={{ background: card.gradient }}>
                    <div className="card-header">
                      <div className="card-icon">
                        <Icon size={24} color="white" aria-hidden="true" />
                      </div>
                      <ChevronRight size={18} color="white" aria-hidden="true" />
                    </div>
                    <h3 className="card-title">{card.title}</h3>
                    <p className="card-desc">{card.description}</p>
                    {card.category !== undefined && (
                      <span className="card-category">
                        Kategori {card.category + 1}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        {activities.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">🕐 Aktivitas Hari Ini</h2>
            </div>
            <div className="activity-list">
              {activities.map((item, idx) => (
                <div key={idx} className="activity-item">
                  <div className={`activity-icon ${item.status.toLowerCase()}`}>
                    {item.status === "OK" ? "✅" : "⚠️"}
                  </div>
                  <div className="activity-content">
                    <p className="activity-title">{item.title}</p>
                    <p className="activity-desc">oleh {item.user}</p>
                  </div>
                  <div className="activity-meta">
                    <span className="activity-time">{item.time}</span>
                    <span className={`activity-status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        .modern-home-page {
          display: flex;
          min-height: 100vh;
          background-color: #f5f6fa;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .main-content {
          flex: 1;
          padding: 24px 36px;
          min-height: calc(100vh - 64px);
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          will-change: margin-left;
        }

        .welcome-banner {
          background: linear-gradient(135deg, #2f00b0 0%, #0987ee 100%);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(79, 172, 254, 0.2);
          gap: 24px;
        }

        .welcome-title {
          font-size: 26px;
          font-weight: 700;
          color: white;
          margin: 0 0 12px 0;
        }

        .welcome-text {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.6;
        }

        .welcome-illustration {
          flex-shrink: 0;
        }

        .role-info-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          border-left: 4px solid #0ea5e9;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 24px;
          font-size: 14px;
          color: #0c4a6e;
        }
        .role-info-banner .role-icon {
          font-size: 24px;
        }
        .role-info-banner strong {
          display: block;
          font-size: 15px;
          margin-bottom: 2px;
        }
        .role-info-banner p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
        }
        .category-badge {
          margin-left: auto;
          background: #0ea5e9;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .section {
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 4px 0;
        }

        .section-desc {
          font-size: 14px;
          color: #718096;
          margin: 0;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .feature-card-link {
          text-decoration: none;
          display: block;
        }

        .feature-card {
          border-radius: 16px;
          padding: 24px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
          gap: 12px;
        }

        .card-icon {
          width: 52px;
          height: 52px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .card-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px 0;
          line-height: 1.3;
        }

        .card-desc {
          font-size: 13px;
          opacity: 0.9;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .card-category {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: rgba(255,255,255,0.3);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          background: white;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1px solid #f5f5f5;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .activity-icon.ok { background: #d1fae5; color: #10b981; }
        .activity-icon.ng { background: #fee2e2; color: #ef4444; }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a202c;
          margin: 0 0 4px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-desc {
          font-size: 12px;
          color: #718096;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }

        .activity-time {
          font-size: 11px;
          color: #a0aec0;
          white-space: nowrap;
        }

        .activity-status {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        .activity-status.ok { background: #d1fae5; color: #059669; }
        .activity-status.ng { background: #fee2e2; color: #dc2626; }

        @media (max-width: 1200px) {
          .cards-grid { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
          .main-content { padding: 20px; }
        }

        @media (max-width: 768px) {
          .modern-home-page { flex-direction: column; }
          .main-content {
            padding: 12px;
            margin: 0 !important;
            max-width: 100%;
          }
          .welcome-banner {
            flex-direction: column;
            text-align: center;
            padding: 16px;
            gap: 16px;
            margin-bottom: 20px;
          }
          .welcome-illustration { max-width: 120px; margin: 0 auto; }
          .welcome-title { font-size: 20px; margin-bottom: 10px; }
          .welcome-text { font-size: 13px; }
          .cards-grid { grid-template-columns: 1fr; gap: 14px; }
          .feature-card { padding: 20px; }
          .card-title { font-size: 18px; }
          .card-desc { font-size: 12px; }
          .section { margin-bottom: 24px; }
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 16px;
            gap: 8px;
          }
          .section-title { font-size: 18px; }
          .role-info-banner {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }
          .category-badge { margin-left: 0; align-self: center; }
        }

        @media (max-width: 480px) {
          .main-content { padding: 8px; }
          .welcome-banner { padding: 12px; gap: 12px; border-radius: 12px; }
          .welcome-title { font-size: 18px; margin-bottom: 8px; }
          .welcome-text { font-size: 12px; line-height: 1.5; }
          .welcome-illustration { max-width: 100px; }
          .cards-grid { grid-template-columns: 1fr; gap: 10px; }
          .feature-card { padding: 16px; border-radius: 12px; }
          .card-header { margin-bottom: 12px; gap: 8px; }
          .card-icon { width: 44px; height: 44px; border-radius: 8px; }
          .card-title { font-size: 16px; margin-bottom: 6px; }
          .card-desc { font-size: 11px; margin-bottom: 12px; }
          .activity-list { gap: 10px; }
          .activity-item { padding: 12px; gap: 8px; border-radius: 10px; }
          .activity-title { font-size: 12px; }
          .activity-desc { font-size: 10px; }
          .activity-icon { width: 32px; height: 32px; min-width: 32px; }
          .activity-time { font-size: 9px; }
          .activity-status { padding: 3px 8px; font-size: 10px; }
        }
      `}</style>
    </div>
  );
}