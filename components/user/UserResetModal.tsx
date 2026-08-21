"use client";

import { useState, useEffect, FormEvent } from "react";
import { User } from "@/lib/auth-context";

interface UserResetModalProps {
  user: User;
}

export function UserResetModal({ user }: UserResetModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [requestType, setRequestType] = useState<"password" | "username">("password");

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Username reset state
  const [newUsername, setNewUsername] = useState("");
  const [confirmUsername, setConfirmUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Cek apakah user memiliki request reset yang berstatus CONFIRMED dari Admin
  useEffect(() => {
    let isMounted = true;

    async function checkConfirmedRequest() {
      if (!user?.username) return;

      try {
        const res = await fetch(`/e-checksheet-ga/api/auth/user-reset-status?username=${encodeURIComponent(user.username)}`);
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return;
        }

        if (res.ok && data.hasConfirmedRequest) {
          if (isMounted) {
            setRequestType(data.requestType === "username" ? "username" : "password");
            setShowModal(true);
          }
        }
      } catch (err) {
        console.error("Gagal mengecek status reset request user:", err);
      }
    }

    checkConfirmedRequest();
    const interval = setInterval(checkConfirmedRequest, 10000); // Polling setiap 10 detik

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  if (!showModal) return null;

  // ── SUBMIT PASSWORD RESET ──────────────────────────────────────────────────
  async function handleSubmitPassword(e: FormEvent) {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Semua field wajib diisi!" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password minimal 6 karakter!" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Password dan konfirmasi tidak cocok!" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/e-checksheet-ga/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          newPassword,
          confirmPassword,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Respon server tidak valid (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah password.");
      }

      setMessage({
        type: "success",
        text: "Password Anda berhasil diperbarui! Modal ini akan ditutup otomatis.",
      });

      setTimeout(() => {
        setShowModal(false);
        setNewPassword("");
        setConfirmPassword("");
        setMessage(null);
      }, 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setLoading(false);
    }
  }

  // ── SUBMIT USERNAME RESET ──────────────────────────────────────────────────
  async function handleSubmitUsername(e: FormEvent) {
    e.preventDefault();

    if (!newUsername || !confirmUsername) {
      setMessage({ type: "error", text: "Semua field wajib diisi!" });
      return;
    }

    if (newUsername.trim().length < 3) {
      setMessage({ type: "error", text: "Username minimal 3 karakter!" });
      return;
    }

    if (newUsername.trim() !== confirmUsername.trim()) {
      setMessage({ type: "error", text: "Username baru dan konfirmasi tidak cocok!" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/e-checksheet-ga/api/auth/reset-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          newUsername: newUsername.trim(),
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Respon server tidak valid (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah username.");
      }

      setMessage({
        type: "success",
        text: `Username berhasil diubah menjadi "${data.newUsername}"! Anda akan perlu login ulang dengan username baru.`,
      });

      setTimeout(() => {
        setShowModal(false);
        setNewUsername("");
        setConfirmUsername("");
        setMessage(null);
        // Logout agar user login ulang dengan username baru
        window.location.href = "/e-checksheet-ga/login-page";
      }, 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setLoading(false);
    }
  }

  const isPasswordReset = requestType === "password";

  return (
    <div className="urm-overlay">
      <div className="urm-backdrop" />

      <div className="urm-container">
        <div className="urm-card">

          {/* HEADER BANNER */}
          <div className="urm-header">
            <div className="urm-header-content">
              <div className="urm-avatar">{isPasswordReset ? "🔑" : "🏷️"}</div>
              <div className="urm-header-info">
                <h2 className="urm-title">
                  {isPasswordReset ? "Reset Password Disetujui" : "Reset Username Disetujui"}
                </h2>
                <p className="urm-subtitle">
                  {isPasswordReset
                    ? "Admin telah menyetujui permohonan reset password Anda"
                    : "Admin telah menyetujui permohonan reset username/ID Anda"}
                </p>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="urm-body">

            {/* Status Message */}
            {message && (
              <div className={`urm-message ${message.type === "success" ? "urm-message-success" : "urm-message-error"}`}>
                <span>{message.type === "success" ? "✅" : "⚠️"}</span>
                <p>{message.text}</p>
              </div>
            )}

            {/* Info Banner */}
            <div className="urm-info-banner">
              <div className="urm-info-icon">💡</div>
              <div className="urm-info-content">
                {isPasswordReset ? (
                  <>
                    <strong>Buat Password Baru</strong>
                    <p>Silakan masukkan password baru untuk akun <span className="urm-mono">@{user.username}</span>. Password minimal 6 karakter.</p>
                  </>
                ) : (
                  <>
                    <strong>Buat Username Baru</strong>
                    <p>Silakan masukkan username baru untuk akun <span className="urm-mono">@{user.username}</span>. Setelah berhasil, Anda akan logout dan perlu login ulang.</p>
                  </>
                )}
              </div>
            </div>

            {/* ── FORM: PASSWORD RESET ── */}
            {isPasswordReset ? (
              <form onSubmit={handleSubmitPassword} className="urm-form">
                <div className="urm-form-group">
                  <label htmlFor="newPassword">Password Baru <span className="urm-required">*</span></label>
                  <div className="urm-password-wrapper">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="urm-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="urm-form-group">
                  <label htmlFor="confirmPassword">Konfirmasi Password Baru <span className="urm-required">*</span></label>
                  <div className="urm-password-wrapper">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="urm-toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="urm-btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="urm-spinner" />
                      Menyimpan Password...
                    </>
                  ) : (
                    <>✅ Simpan Password Baru</>
                  )}
                </button>
              </form>
            ) : (
              /* ── FORM: USERNAME RESET ── */
              <form onSubmit={handleSubmitUsername} className="urm-form">
                <div className="urm-form-group">
                  <label htmlFor="currentUsername">Username Saat Ini</label>
                  <input
                    id="currentUsername"
                    type="text"
                    value={user.username}
                    disabled
                    className="urm-input-disabled"
                  />
                </div>

                <div className="urm-form-group">
                  <label htmlFor="newUsername">Username Baru <span className="urm-required">*</span></label>
                  <input
                    id="newUsername"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                    placeholder="Minimal 3 karakter (a-z, 0-9, _, -, .)"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="urm-form-group">
                  <label htmlFor="confirmUsername">Konfirmasi Username Baru <span className="urm-required">*</span></label>
                  <input
                    id="confirmUsername"
                    type="text"
                    value={confirmUsername}
                    onChange={(e) => setConfirmUsername(e.target.value.toLowerCase())}
                    placeholder="Ulangi username baru"
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="urm-btn-primary urm-btn-purple"
                >
                  {loading ? (
                    <>
                      <span className="urm-spinner" />
                      Menyimpan Username...
                    </>
                  ) : (
                    <>🏷️ Simpan Username Baru</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ════════════════════════════════════════════════════════════
           OVERLAY & BACKDROP
        ════════════════════════════════════════════════════════════ */
        .urm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .urm-backdrop {
          position: absolute; inset: 0;
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(4px);
        }
        .urm-container {
          position: relative; width: 100%; max-width: 460px;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ════════════════════════════════════════════════════════════
           CARD & HEADER
        ════════════════════════════════════════════════════════════ */
        .urm-card {
          background: white;
          border-radius: 16px;
          border: 2px solid #f1f5f9;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }
        .urm-header {
          background: linear-gradient(135deg, #1e293b 0%, #1e3a5f 55%, #1565c0 100%);
          padding: 24px;
          position: relative;
          overflow: hidden;
        }
        .urm-header::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            radial-gradient(circle at 18% 60%, rgba(30, 136, 229, 0.18) 0%, transparent 55%),
            radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.06) 0%, transparent 40%);
          pointer-events: none;
        }
        .urm-header-content {
          position: relative;
          display: flex; align-items: center; gap: 16px;
        }
        .urm-avatar {
          width: 58px; height: 58px;
          background: rgba(255, 255, 255, 0.13);
          border: 1.5px solid rgba(255, 255, 255, 0.22);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; flex-shrink: 0;
        }
        .urm-header-info { flex: 1; min-width: 0; }
        .urm-title {
          margin: 0 0 5px;
          font-size: 18px; font-weight: 700;
          color: #ffffff; letter-spacing: -0.3px;
        }
        .urm-subtitle {
          margin: 0;
          font-size: 13px; color: rgba(255, 255, 255, 0.62);
        }

        /* ════════════════════════════════════════════════════════════
           BODY
        ════════════════════════════════════════════════════════════ */
        .urm-body { padding: 24px; }

        /* ════════════════════════════════════════════════════════════
           MESSAGES
        ════════════════════════════════════════════════════════════ */
        .urm-message {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 18px; border-radius: 10px;
          margin-bottom: 16px; font-size: 13px; font-weight: 500;
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .urm-message-success {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          border-left: 4px solid #22c55e; color: #166534;
        }
        .urm-message-error {
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          border-left: 4px solid #ef4444; color: #991b1b;
        }
        .urm-message p { margin: 0; flex: 1; line-height: 1.5; }

        /* ════════════════════════════════════════════════════════════
           INFO BANNER
        ════════════════════════════════════════════════════════════ */
        .urm-info-banner {
          display: flex; align-items: flex-start; gap: 14px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 2px solid #93c5fd; border-radius: 10px;
          padding: 14px 18px; margin-bottom: 20px;
        }
        .urm-info-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
        .urm-info-content { flex: 1; }
        .urm-info-content strong {
          display: block; color: #1e40af;
          font-size: 13px; margin-bottom: 4px;
        }
        .urm-info-content p {
          margin: 0; color: #3b82f6;
          font-size: 12px; line-height: 1.5;
        }
        .urm-mono {
          font-family: monospace; font-weight: 600;
          background: rgba(255,255,255,0.6);
          padding: 1px 6px; border-radius: 4px;
        }

        /* ════════════════════════════════════════════════════════════
           FORM
        ════════════════════════════════════════════════════════════ */
        .urm-form {
          display: flex; flex-direction: column; gap: 16px;
        }
        .urm-form-group {
          display: flex; flex-direction: column; gap: 6px;
        }
        .urm-form-group label {
          font-size: 13px; font-weight: 600; color: #334155;
          display: flex; align-items: center; gap: 4px;
        }
        .urm-required { color: #ef4444; }
        .urm-form-group input {
          padding: 12px 14px;
          border: 2px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none; font-family: inherit; width: 100%; box-sizing: border-box;
        }
        .urm-form-group input:focus {
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.15);
        }
        .urm-form-group input:disabled, .urm-input-disabled {
          background: #f8fafc !important; color: #94a3b8 !important; cursor: not-allowed !important;
        }

        /* ════════════════════════════════════════════════════════════
           PASSWORD WRAPPER
        ════════════════════════════════════════════════════════════ */
        .urm-password-wrapper {
          position: relative; display: flex; align-items: center;
        }
        .urm-password-wrapper input {
          width: 100%; padding-right: 44px;
        }
        .urm-toggle-password {
          position: absolute; right: 10px;
          background: none; border: none;
          font-size: 16px; cursor: pointer;
          padding: 4px; opacity: 0.7;
          transition: opacity 0.2s;
        }
        .urm-toggle-password:hover { opacity: 1; }
        .urm-toggle-password:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ════════════════════════════════════════════════════════════
           BUTTONS
        ════════════════════════════════════════════════════════════ */
        .urm-btn-primary {
          padding: 14px 24px;
          background: linear-gradient(135deg, #1e88e5, #1565c0);
          color: white; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px; font-family: inherit; width: 100%;
        }
        .urm-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(30, 136, 229, 0.35);
        }
        .urm-btn-primary:disabled {
          opacity: 0.7; cursor: not-allowed; transform: none;
        }
        .urm-btn-purple {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
        }
        .urm-btn-purple:hover:not(:disabled) {
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35) !important;
        }
        .urm-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}