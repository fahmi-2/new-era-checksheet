// components/admin/ShowPasswordModal.tsx
"use client";
import { useState, FormEvent } from "react";
import { User } from "@/app/admin/accounts/types";

interface ShowPasswordModalProps {
  targetUser: User;
  onClose: () => void;
}

export function ShowPasswordModal({ targetUser, onClose }: ShowPasswordModalProps) {
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [showDecrypted, setShowDecrypted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!adminPassword) {
      setError("Masukkan password admin Anda!");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem("auth_current_user_v2");
      let adminId = "", adminRole = "";
      if (userStr) {
        try { const o = JSON.parse(userStr); adminId = o.id || ""; adminRole = o.role || ""; } catch { }
      }
      const res = await fetch("/e-checksheet-ga/api/admin/show-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": adminId, "x-user-role": adminRole || "admin" },
        body: JSON.stringify({ targetUserId: targetUser.id, adminPassword }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Respon server tidak valid (${res.status})`); }
      if (!res.ok) throw new Error(data.error || "Gagal membuka password user.");
      setDecryptedPassword(data.data.password);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!decryptedPassword) return;
    navigator.clipboard.writeText(decryptedPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="spm-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="spm-backdrop absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="spm-container relative w-full max-w-[430px]">
        <div className="spm-card bg-white shadow-2xl ring-1 ring-black/5">

          {/* ===== HEADER ===== */}
          <div className={`spm-header relative overflow-hidden text-white transition-colors duration-500 ${decryptedPassword ? "spm-header-success" : ""}`}>
            {/* Ambient Background Circles */}
            <div className="spm-circle-1 pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-xl" />
            <div className="spm-circle-2 pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="spm-close-btn"
            >
              <span className="spm-cross-icon" aria-hidden="true">✕</span>
            </button>

            {/* Icon */}
            <div className="spm-icon-box relative mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner backdrop-blur-sm">
              {decryptedPassword ? (
                <svg className="h-6 w-6 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h2 className="spm-title relative text-xl font-bold tracking-tight text-white">
              {decryptedPassword ? "Password Terbuka" : "Lihat Password"}
            </h2>
            <p className="spm-subtitle relative mt-1 text-xs text-white/80 font-medium">
              {decryptedPassword ? "Identitas admin berhasil diverifikasi" : "Verifikasi identitas admin dulu ya"}
            </p>
          </div>

          {/* ===== BODY ===== */}
          <div className="spm-body bg-white">

            {/* Target user card */}
            <div className="spm-user-card mb-5 flex items-center gap-3.5 border border-slate-100 bg-slate-50/80 p-3.5 shadow-sm">
              <span className={`spm-avatar flex h-11 w-11 flex-none items-center justify-center text-sm font-bold text-white shadow-md ${decryptedPassword ? "spm-avatar-success" : ""}`}>
                {(targetUser.fullName?.charAt(0) || "U").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">{targetUser.fullName}</p>
                <p className="truncate text-xs text-slate-500 font-medium">
                  @{targetUser.username}
                  <span className="mx-1.5 text-slate-300">·</span>
                  <span className="font-mono text-[11px] text-slate-400">{targetUser.nik}</span>
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="spm-error mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3">
                <svg className="mt-0.5 h-4 w-4 flex-none text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-medium leading-relaxed text-rose-700">{error}</p>
              </div>
            )}

            {/* ===== DECRYPTED PASSWORD VIEW ===== */}
            {decryptedPassword ? (
              <div className="space-y-5">
                {/* Password display card with fresh Teal/Emerald gradient */}
                <div className="spm-result-card relative overflow-hidden rounded-2xl p-6 text-center shadow-xl">
                  <p className="relative mb-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                    <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Terverifikasi
                  </p>
                  <p className="spm-password-text relative break-all font-mono text-2xl font-bold tracking-wider text-emerald-50 select-all">
                    {showDecrypted ? decryptedPassword : "•".repeat(Math.min(decryptedPassword.length, 16))}
                  </p>
                  <div className="relative mt-5 flex justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowDecrypted((v) => !v)}
                      className="spm-btn-toggle rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all active:scale-95"
                    >
                      {showDecrypted ? "Sembunyikan" : "Tampilkan"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`spm-btn-copy rounded-xl px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${copied
                        ? "spm-btn-copied"
                        : "text-white"
                        }`}
                    >
                      {copied ? "✓ Disalin!" : "Salin"}
                    </button>
                  </div>
                </div>

                {/* Warning text */}
                <p className="text-center text-[11px] leading-relaxed text-slate-400 font-medium">
                  Jaga kerahasiaan data ini. Jangan bagikan ke siapapun yang tidak berwenang.
                </p>

                {/* Close button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="spm-btn-close-final w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg active:scale-[0.98]"
                >
                  Selesai & Tutup
                </button>
              </div>
            ) : (
              /* ===== VERIFY FORM ===== */
              <form onSubmit={handleVerify} className="spm-form space-y-5">
                {/* Password input */}
                <div className="spm-field-group">
                  <label className="spm-label mb-2 block text-xs font-semibold text-slate-700">
                    Password Admin Anda
                  </label>
                  <div className="spm-input-container relative">
                    <span className="spm-input-icon pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input
                      type={showAdminPw ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Masukkan password Anda sendiri"
                      disabled={loading}
                      autoFocus
                      className="spm-input w-full text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPw((v) => !v)}
                      className="spm-eye-btn absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-400 hover:text-indigo-600"
                    >
                      {showAdminPw ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="spm-actions flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="spm-btn-cancel flex-1 text-sm font-semibold active:scale-[0.98]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="spm-btn-submit flex-1 text-sm font-bold text-white shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Verifikasi...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Lihat Password
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Scoped CSS to completely prevent Tailwind/Global styles conflicts */}
      <style jsx>{`
        .spm-overlay {
          animation: spmFadeIn 0.2s ease-out;
        }
        .spm-container {
          animation: spmPopIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .spm-card {
          border-radius: 26px !important;
          overflow: hidden !important;
          box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35) !important;
        }
        .spm-header {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%) !important;
          padding: 24px 24px 22px 24px !important;
          transition: background 0.4s ease !important;
        }
        .spm-header.spm-header-success {
          background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%) !important;
        }
        .spm-close-btn {
          position: absolute !important;
          right: 16px !important;
          top: 16px !important;
          width: 32px !important;
          height: 32px !important;
          border: none !important;
          outline: none !important;
          cursor: pointer !important;
          background: rgba(255, 255, 255, 0.2) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          color: #ffffff !important;
          z-index: 20 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          transition: all 0.2s ease !important;
        }
        .spm-close-btn:hover {
          background: rgba(255, 255, 255, 0.35) !important;
          color: #ffffff !important;
          transform: rotate(90deg) scale(1.08) !important;
        }
        .spm-cross-icon {
          display: block !important;
          font-size: 16px !important;
          font-weight: 800 !important;
          line-height: 1 !important;
          color: #ffffff !important;
          text-align: center !important;
          user-select: none !important;
          transform: translateY(-0.5px);
        }
        .spm-icon-box {
          background: rgba(255, 255, 255, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 14px !important;
        }
        .spm-title {
          margin: 0 !important;
          line-height: 1.3 !important;
        }
        .spm-subtitle {
          margin-top: 4px !important;
        }
        .spm-body {
          padding: 24px !important;
        }
        .spm-user-card {
          border-radius: 16px !important;
          padding: 12px 14px !important;
          margin-bottom: 20px !important;
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
        }
        .spm-avatar {
          border-radius: 12px !important;
          background: linear-gradient(135deg, #4f46e5, #3b82f6) !important;
        }
        .spm-avatar.spm-avatar-success {
          background: linear-gradient(135deg, #059669, #0d9488) !important;
        }
        .spm-label {
          margin-bottom: 8px !important;
        }
        .spm-input-container {
          position: relative !important;
        }
        .spm-input {
          display: block !important;
          width: 100% !important;
          padding: 12px 42px 12px 40px !important;
          border-radius: 14px !important;
          border: 2px solid #e2e8f0 !important;
          background-color: #f8fafc !important;
          font-size: 14px !important;
          box-sizing: border-box !important;
          transition: all 0.2s ease !important;
        }
        .spm-input:focus {
          border-color: #6366f1 !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15) !important;
        }
        .spm-actions {
          display: flex !important;
          gap: 12px !important;
          margin-top: 20px !important;
        }
        .spm-btn-cancel {
          padding: 12px 16px !important;
          border-radius: 14px !important;
          border: 2px solid #e2e8f0 !important;
          background-color: #ffffff !important;
          color: #475569 !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
        }
        .spm-btn-cancel:hover {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
        .spm-btn-submit {
          padding: 12px 16px !important;
          border-radius: 14px !important;
          border: none !important;
          background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%) !important;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35) !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
        }
        .spm-btn-submit:hover:not(:disabled) {
          box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45) !important;
          filter: brightness(1.05) !important;
        }
        .spm-result-card {
          background: linear-gradient(135deg, #064e3b 0%, #0f172a 60%, #022c22 100%) !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
          box-shadow: 0 16px 36px -8px rgba(5, 150, 105, 0.3) !important;
        }
        .spm-password-text {
          text-shadow: 0 0 16px rgba(52, 211, 153, 0.4) !important;
        }
        .spm-btn-toggle, .spm-btn-copy {
          background: rgba(255, 255, 255, 0.12) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          color: #ffffff !important;
          cursor: pointer !important;
        }
        .spm-btn-toggle:hover, .spm-btn-copy:hover {
          background: rgba(255, 255, 255, 0.24) !important;
        }
        .spm-btn-copy.spm-btn-copied {
          background: #10b981 !important;
          color: #ffffff !important;
          border-color: #059669 !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
        }
        .spm-btn-close-final {
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%) !important;
          border: none !important;
          color: #ffffff !important;
          cursor: pointer !important;
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.35) !important;
          transition: all 0.2s ease !important;
        }
        .spm-btn-close-final:hover {
          filter: brightness(1.08) !important;
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.45) !important;
        }

        @keyframes spmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spmPopIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}