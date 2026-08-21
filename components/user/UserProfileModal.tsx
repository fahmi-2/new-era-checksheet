"use client";

import { useState } from "react";
import { User } from "@/lib/auth-context";

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  "group-leader-qa": "Group Leader QA",
  "inspector-qa": "Inspector QA",
  "inspector-ga": "Inspector GA",
  "inspector-ga-fire": "Inspector GA · Fire",
  "inspector-ga-equipment": "Inspector GA · Equipment",
  "inspector-ga-electrical": "Inspector GA · Electrical",
  "inspector-ga-personal": "Inspector GA · Personal",
  "inspector-ga-facility": "Inspector GA · Facility",
  "eso": "ESO",
  "admin": "Admin",
  "superadmin": "Super Admin",
};

export function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<"password" | "username" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSendRequest = async (type: "password" | "username") => {
    setLoading(true);
    setMessage(null);
    setRequestType(type);
    try {
      const res = await fetch("/e-checksheet-ga/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, requestType: type }),
      });
      const responseText = await res.text();
      let data;
      try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Respon server tidak valid (${res.status})`); }
      if (!res.ok) throw new Error(data.error || "Gagal mengirim permohonan.");
      setMessage({
        type: "success",
        text: data.message || `Permohonan ganti ${type === "password" ? "password" : "username"} berhasil dikirim ke Admin. Mohon tunggu konfirmasi.`,
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan saat mengirim permohonan." });
    } finally {
      setLoading(false);
    }
  };

  const infoRows = [
    {
      label: "Username",
      value: <span className="upm-mono">@{user.username}</span>,
      icon: "👤",
    },
    {
      label: "NIK",
      value: <span>{user.nik || "—"}</span>,
      icon: "🆔",
    },
    {
      label: "Departemen",
      value: <span className="upm-capitalize">{user.department ? user.department.replace(/-/g, " ") : "—"}</span>,
      icon: "🏢",
    },
    {
      label: "Role",
      value: <span className="upm-role-badge">{ROLE_LABELS[user.role] || user.role}</span>,
      icon: "🛡️",
    },
  ];

  return (
    <div className="upm-overlay">
      <div className="upm-backdrop" onClick={onClose} />

      <div className="upm-container">
        <div className="upm-card">

          {/* HEADER BANNER */}
          <div className="upm-header">


            <div className="upm-header-content">
              <div className="upm-avatar">
                {(user.fullName?.charAt(0) || "U").toUpperCase()}
                <span className="upm-online-dot" />
              </div>
              <div className="upm-header-info">
                <h2 className="upm-name">{user.fullName || "Pengguna"}</h2>
                <p className="upm-username">@{user.username}</p>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="upm-body">

            {/* Status Message */}
            {message && (
              <div className={`upm-message ${message.type === "success" ? "upm-message-success" : "upm-message-error"}`}>
                <span>{message.type === "success" ? "✅" : "⚠️"}</span>
                <p>{message.text}</p>
              </div>
            )}

            {/* Info List */}
            <div className="upm-section-title">Informasi Akun</div>
            <div className="upm-info-list">
              {infoRows.map((row, i) => (
                <div key={i} className="upm-info-row">
                  <div className="upm-info-label-wrap">
                    <span className="upm-info-icon">{row.icon}</span>
                    <span className="upm-info-label">{row.label}</span>
                  </div>
                  <div className="upm-info-value">{row.value}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="upm-section-title" style={{ marginTop: 20 }}>
              Permohonan Perubahan
              <span className="upm-approval-badge">Butuh Approval Admin</span>
            </div>

            <div className="upm-actions-grid">
              <button
                className="upm-action-card"
                onClick={() => handleSendRequest("password")}
                disabled={loading}
              >
                <div className="upm-action-icon upm-icon-blue">🔑</div>
                <div className="upm-action-text">
                  <strong>{loading && requestType === "password" ? "Mengirim..." : "Request Password Baru"}</strong>
                  <span>Minta Admin untuk me-reset password akun Anda</span>
                </div>
              </button>

              <button
                className="upm-action-card"
                onClick={() => handleSendRequest("username")}
                disabled={loading}
              >
                <div className="upm-action-icon upm-icon-purple">🏷️</div>
                <div className="upm-action-text">
                  <strong>{loading && requestType === "username" ? "Mengirim..." : "Request Username Baru"}</strong>
                  <span>Minta Admin untuk mengubah username akun Anda</span>
                </div>
              </button>
            </div>

            {/* Footer Button */}
            <button className="upm-btn-secondary" onClick={onClose}>
              Tutup
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ════════════════════════════════════════════════════════════
           OVERLAY & BACKDROP
        ════════════════════════════════════════════════════════════ */
        .upm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .upm-backdrop {
          position: absolute; inset: 0;
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(4px);
        }
        .upm-container {
          position: relative; width: 100%; max-width: 440px;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ════════════════════════════════════════════════════════════
           CARD & HEADER
        ════════════════════════════════════════════════════════════ */
        .upm-card {
          background: white;
          border-radius: 16px;
          border: 2px solid #f1f5f9;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }
        .upm-header {
          background: linear-gradient(135deg, #1e293b 0%, #1e3a5f 55%, #1565c0 100%);
          padding: 24px;
          position: relative;
        }
        .upm-close-btn {
          position: absolute; top: 16px; right: 16px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white; width: 32px; height: 32px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 14px; font-weight: 600;
          transition: all 0.2s;
        }
        .upm-close-btn:hover { background: rgba(255, 255, 255, 0.25); }
        
        .upm-header-content {
          display: flex; align-items: center; gap: 16px;
        }
        .upm-avatar {
          width: 64px; height: 64px;
          background: rgba(255, 255, 255, 0.13);
          border: 1.5px solid rgba(255, 255, 255, 0.22);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 700; color: white;
          position: relative; flex-shrink: 0;
        }
        .upm-online-dot {
          position: absolute; bottom: -2px; right: -2px;
          width: 16px; height: 16px;
          background: #22c55e; border: 2px solid #1e3a5f;
          border-radius: 50%;
        }
        .upm-header-info { flex: 1; min-width: 0; }
        .upm-name { margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; }
        .upm-username { margin: 4px 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.7); font-family: monospace; }

        /* ════════════════════════════════════════════════════════════
           BODY & SECTIONS
        ════════════════════════════════════════════════════════════ */
        .upm-body { padding: 24px; }
        .upm-section-title {
          font-size: 13px; font-weight: 700; color: #1e293b;
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
        }
        .upm-approval-badge {
          font-size: 10px; font-weight: 600;
          background: #fef3c7; color: #92400e;
          padding: 2px 8px; border-radius: 12px;
          border: 1px solid #fde68a;
        }

        /* ════════════════════════════════════════════════════════════
           INFO LIST
        ════════════════════════════════════════════════════════════ */
        .upm-info-list {
          background: #f8fafc; border: 2px solid #e2e8f0;
          border-radius: 12px; overflow: hidden; margin-bottom: 20px;
        }
        .upm-info-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid #e2e8f0;
        }
        .upm-info-row:last-child { border-bottom: none; }
        .upm-info-label-wrap { display: flex; align-items: center; gap: 10px; }
        .upm-info-icon { font-size: 16px; }
        .upm-info-label { font-size: 13px; color: #64748b; font-weight: 500; }
        .upm-info-value { font-size: 13px; color: #1e293b; font-weight: 600; }
        .upm-mono { font-family: monospace; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 6px; font-size: 12px; }
        .upm-capitalize { text-transform: capitalize; }
        .upm-role-badge {
          font-size: 11px; font-weight: 600;
          background: linear-gradient(135deg, #1e88e5, #1565c0);
          color: white; padding: 4px 10px; border-radius: 20px;
        }

        /* ════════════════════════════════════════════════════════════
           ACTION CARDS
        ════════════════════════════════════════════════════════════ */
        .upm-actions-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 24px; }
        .upm-action-card {
          display: flex; align-items: center; gap: 14px;
          padding: 14px; border: 2px solid #e2e8f0;
          border-radius: 12px; background: white;
          cursor: pointer; transition: all 0.2s; text-align: left;
          font-family: inherit;
        }
        .upm-action-card:hover:not(:disabled) {
          border-color: #1e88e5; background: #eff6ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.12);
        }
        .upm-action-card:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .upm-action-icon {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0; color: white;
        }
        .upm-icon-blue { background: linear-gradient(135deg, #1e88e5, #1565c0); }
        .upm-icon-purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        
        .upm-action-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .upm-action-text strong { font-size: 13px; font-weight: 700; color: #1e293b; }
        .upm-action-text span { font-size: 11px; color: #64748b; line-height: 1.4; }

        /* ════════════════════════════════════════════════════════════
           MESSAGES & BUTTONS
        ════════════════════════════════════════════════════════════ */
        .upm-message {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 18px; border-radius: 10px;
          margin-bottom: 20px; font-size: 13px; font-weight: 500;
        }
        .upm-message-success { background: linear-gradient(135deg, #dcfce7, #bbf7d0); border-left: 4px solid #22c55e; color: #166534; }
        .upm-message-error { background: linear-gradient(135deg, #fef2f2, #fee2e2); border-left: 4px solid #ef4444; color: #991b1b; }
        .upm-message p { margin: 0; flex: 1; line-height: 1.5; }

        .upm-btn-secondary {
          width: 100%; padding: 12px 20px;
          background: #f1f5f9; color: #475569;
          border: 2px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; font-family: inherit;
        }
        .upm-btn-secondary:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
}