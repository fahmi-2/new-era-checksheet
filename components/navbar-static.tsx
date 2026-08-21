// app/components/navbar-static.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ChevronDown, Bell, LogOut } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  read: boolean;
  pelaporanId?: string;
}

interface NavbarStaticProps {
  userName: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function NavbarStatic({ 
  userName = "User", 
  collapsed = false,
  onToggleCollapse 
}: NavbarStaticProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load notifications
  useEffect(() => {
    const loadNotifications = () => {
      const saved = localStorage.getItem("notifications");
      if (saved) {
        const notifs = JSON.parse(saved);
        setNotifications(notifs);
        const unread = notifs.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      }
    };

    loadNotifications();
    const handler = () => loadNotifications();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleNotificationClick = (notif: Notification) => {
    const updated = notifications.map((n) =>
      n.id === notif.id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem("notifications", JSON.stringify(updated));

    if (notif.pelaporanId) {
      router.push(`/pelaporan-list?selectedId=${notif.pelaporanId}`);
    } else {
      router.push("/pelaporan-list");
    }

    setShowNotifications(false);
  };

  const handleClearNotifications = () => {
    localStorage.setItem("notifications", JSON.stringify([]));
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <nav className="navbar-static">
      {/* Left: Logo + Brand */}
<div className="brand-section">
  <Link href="/home" className="logo-link">
    <img
      src="/images/logo-pt-jatim-autocomp-indonesia.jpg"
      alt="PT Jatim Autocomp Indonesia"
      className="company-logo"
    />
    <div className="brand-text-wrapper">
      <span className="brand-text">E-CheckSheet</span>
      <span className="brand-subtext">PT Jatim Autocomp Indonesia</span>
    </div>
  </Link>
</div>


      {/* Center: Navigation Links */}
      <div className="nav-links">
        <Link href="/home" className="nav-link">
          🏠 Beranda
        </Link>
        <Link href="/dashboard" className="nav-link">
          📊 Dashboard
        </Link>
        <Link href="/pelaporan-list" className="nav-link">
          📑 Pelaporan
        </Link>
      </div>

      {/* Right: Notifications & User Menu */}
      <div className="user-menu">
        {/* Notification Bell */}
        <div className="notification-wrapper">
          <button
            className="bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifikasi"
          >
            <Bell size={20} color="#1976d2" />
            {unreadCount > 0 && <span className="bell-count">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h5>Notifikasi</h5>
                {notifications.length > 0 && (
                  <button className="notif-clear-btn" onClick={handleClearNotifications}>
                    ✕
                  </button>
                )}
              </div>
              <div className="notif-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty">Tidak ada notifikasi</div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notif-item ${notif.read ? "" : "unread"}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notif-dot"></div>
                      <div className="notif-content">
                        <p className="notif-text">{notif.message}</p>
                        <span className="notif-time">
                          {new Date(notif.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="user-button"
          aria-expanded={isMenuOpen}
        >
          <div className="avatar">
            <span>{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role">Inspector GA</span>
          </div>
          <ChevronDown size={16} />
        </button>

        {isMenuOpen && (
          <div className="dropdown-menu">
            <button onClick={logout} className="menu-item">
              <LogOut size={18} /> Keluar
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .navbar-static {
          background: white;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;
          height: 64px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        /* Brand Section */
        .brand-section {
  display: flex;
  align-items: center;
}


        .logo-link {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
}


        .company-logo {
  height: 44px;
  width: auto;
  object-fit: contain;
  border-radius: 6px;
}
.brand-text-wrapper {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}


        .brand-text {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
  letter-spacing: -0.3px;
}
.brand-subtext {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          margin-left: 8px;
        }

        /* Nav Links */
        .nav-links {
          display: flex;
          gap: 24px;
        }

        .nav-link {
          text-decoration: none;
          color: #1976d2;
          font-weight: 600;
          font-size: 15px;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #0d47a1;
        }

        /* User Menu */
        .user-menu {
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
        }

        /* Notification */
        .notification-wrapper {
          position: relative;
        }

        .bell-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .bell-btn:hover {
          background: #e3f2fd;
        }

        .bell-count {
          position: absolute;
          top: -2px;
          right: -4px;
          background: #d32f2f;
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: white;
          border-radius: 10px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          width: 340px;
          max-height: 450px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 1000;
          border: 1px solid #eee;
        }

        .notif-header {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fafafa;
        }

        .notif-header h5 {
          margin: 0;
          color: #1976d2;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .notif-clear-btn {
          background: none;
          border: none;
          color: #999;
          font-size: 1.1rem;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .notif-clear-btn:hover {
          background: #f0f0f0;
          color: #1976d2;
        }

        .notif-body {
          flex: 1;
          overflow-y: auto;
          max-height: 380px;
        }

        .notif-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #f8f8f8;
          cursor: pointer;
          transition: all 0.2s ease;
          align-items: flex-start;
        }

        .notif-item:hover {
          background: #f5fbff;
        }

        .notif-item.unread {
          background: #e3f2fd;
          border-left: 3px solid #1976d2;
          padding-left: 13px;
        }

        .notif-dot {
          width: 8px;
          height: 8px;
          background: #d32f2f;
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .notif-item.unread .notif-dot {
          background: #1976d2;
        }

        .notif-content {
          flex: 1;
          min-width: 0;
        }

        .notif-text {
          margin: 0;
          color: #333;
          font-size: 0.88rem;
          font-weight: 500;
          line-height: 1.4;
          word-break: break-word;
        }

        .notif-time {
          display: block;
          color: #777;
          font-size: 0.75rem;
          margin-top: 4px;
        }

        .notif-empty {
          padding: 32px 16px;
          text-align: center;
          color: #999;
          font-size: 0.9rem;
        }

        /* User Button */
        .user-button {
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .user-button:hover {
          background: #f3f4f6;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #bbdefb;
          border: 2px solid #90caf9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d47a1;
          font-weight: 700;
          font-size: 16px;
        }

        .user-info {
          text-align: left;
        }

        .user-name {
          font-weight: 600;
          color: #111827;
          font-size: 14px;
        }

        .user-role {
          font-size: 12px;
          color: #6b7280;
          font-weight: 400;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          min-width: 160px;
          z-index: 1000;
        }

        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          color: #111827;
          font-size: 14px;
          transition: background 0.2s;
        }

        .menu-item:hover {
          background: #f3f4f6;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .navbar-static {
            padding: 0 16px;
            height: 56px;
          }

          @media (max-width: 768px) {
  .brand-subtext {
    display: none;
  }
}


          .nav-links {
            gap: 16px;
          }

          .nav-link {
            font-size: 14px;
          }

          .avatar {
            width: 32px;
            height: 32px;
            font-size: 14px;
          }

          .user-name {
            font-size: 13px;
          }

          .user-role {
            font-size: 11px;
          }
        }

        @media (max-width: 768px) {
          .brand-text {
            display: none;
          }

          .company-logo {
            height: 48px;
          }

          .nav-links {
            display: none;
          }

          .user-info {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
} 