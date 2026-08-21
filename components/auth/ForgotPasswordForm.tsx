// components/auth/ForgotPasswordForm.tsx
"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim()) { setMessage({ type: "error", text: "Username wajib diisi!" }); return; }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/e-checksheet-ga/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const responseText = await res.text();
      let data;
      try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Respon server tidak valid (${res.status})`); }
      if (!res.ok) throw new Error(data.error || "Gagal mengirim request.");
      setMessage({ type: "success", text: data.message || "Request reset password berhasil dikirim ke Admin." });
      setUsername("");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Terjadi kesalahan." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${message.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
          <div className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg ${message.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
            {message.type === "success"
              ? <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            }
          </div>
          <p className={`text-sm font-medium ${message.type === "success" ? "text-emerald-800" : "text-rose-800"}`}>{message.text}</p>
        </div>
      )}

      <div>
        <label htmlFor="fp-username" className="mb-1.5 block text-sm font-semibold text-slate-700">Username</label>
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <input
            id="fp-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username Anda"
            disabled={loading}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Mengirim...</>
          ) : (
            <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Kirim Request Reset Password</>
          )}
        </span>
      </button>

      <div className="text-center">
        <Link
          href="/e-checksheet-ga/login-page"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Kembali ke Halaman Login
        </Link>
      </div>
    </form>
  );
}