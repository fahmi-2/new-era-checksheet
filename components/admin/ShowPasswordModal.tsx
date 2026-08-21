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
    if (!adminPassword) { setError("Masukkan password admin Anda!"); return; }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          {/* amber accent top */}
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

          <div className="p-6">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 ring-1 ring-amber-200">
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Lihat Password</h2>
                  <p className="text-xs text-slate-500">Verifikasi identitas admin dulu</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Target user chip */}
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-bold text-white ring-2 ring-white shadow">
                {(targetUser.fullName?.charAt(0) || "U").toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{targetUser.fullName}</p>
                <p className="truncate text-xs text-slate-500 font-mono">@{targetUser.username} &middot; {targetUser.nik}</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5">
                <svg className="h-4 w-4 flex-none text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-medium text-rose-700">{error}</p>
              </div>
            )}

            {decryptedPassword ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-center">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Password Akun</p>
                  <p className="font-mono text-2xl font-bold tracking-widest text-white select-all">
                    {showDecrypted ? decryptedPassword : "•".repeat(decryptedPassword.length)}
                  </p>
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      onClick={() => setShowDecrypted((v) => !v)}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-white/20 transition-colors"
                    >
                      {showDecrypted ? "Sembunyikan" : "Tampilkan"}
                    </button>
                    <button
                      onClick={handleCopy}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${copied ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
                    >
                      {copied ? "✓ Disalin!" : "Salin"}
                    </button>
                  </div>
                </div>
                <p className="text-center text-[11px] text-slate-400">
                  Jaga kerahasiaan data ini. Jangan bagikan ke siapapun yang tidak berwenang.
                </p>
                <button
                  onClick={onClose}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.98] transition-all"
                >
                  Selesai & Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Password Admin Anda
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPw ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Masukkan password Anda sendiri"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-4 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-500/25 hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60 transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Verifikasi...
                      </span>
                    ) : "Lihat Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.93) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .animate-scale-in { animation: scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
