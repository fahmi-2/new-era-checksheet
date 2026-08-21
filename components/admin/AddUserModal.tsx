// components/admin/AddUserModal.tsx
"use client";

import { useState } from "react";
import { VALID_CHECKSHEETS } from "@/app/admin/accounts/page";

const VALID_ROLES = [
  { value: "group-leader-qa", label: "Group Leader QA" },
  { value: "inspector-qa", label: "Inspector QA" },
  { value: "inspector-ga", label: "Inspector GA" },
  { value: "inspector-ga-fire", label: "Inspector GA - Fire" },
  { value: "inspector-ga-equipment", label: "Inspector GA - Equipment" },
  { value: "inspector-ga-electrical", label: "Inspector GA - Electrical" },
  { value: "inspector-ga-personal", label: "Inspector GA - Personal" },
  { value: "inspector-ga-facility", label: "Inspector GA - Facility" },
  { value: "eso", label: "ESO" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
];

const VALID_DEPARTMENTS = [
  { value: "quality", label: "Quality" },
  { value: "qa", label: "QA" },
  { value: "general-affairs", label: "General Affairs" },
  { value: "ga", label: "GA" },
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserModal({ onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    nik: "",
    department: "",
    role: "",
    password: "",
    confirmPassword: "",
    checksheets: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [showPw, setShowPw] = useState(false);

  const validate1 = () => {
    if (!formData.username.trim() || !formData.fullName.trim() || !formData.nik.trim()) { setError("Username, Nama, dan NIK wajib diisi!"); return false; }
    if (!formData.role || !formData.department) { setError("Role dan Departemen wajib dipilih!"); return false; }
    if (!formData.password || formData.password.length < 6) { setError("Password minimal 6 karakter!"); return false; }
    if (formData.password !== formData.confirmPassword) { setError("Password tidak cocok!"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const userStr = localStorage.getItem("auth_current_user_v2");
      let userRole = "";
      if (userStr) { try { userRole = JSON.parse(userStr).role || ""; } catch { } }
      if (!userRole) userRole = localStorage.getItem("userRole") || "admin";

      const res = await fetch("/e-checksheet-ga/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-role": userRole },
        body: JSON.stringify(formData),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { throw new Error(`Respon server tidak valid (${res.status})`); }
      if (data.success) { onSuccess(); } else { setError(data.error || "Gagal membuat akun"); }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  const toggleChecksheet = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      checksheets: prev.checksheets.includes(key)
        ? prev.checksheets.filter((c) => c !== key)
        : [...prev.checksheets, key],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative flex w-full max-w-2xl flex-col animate-scale-in" style={{ maxHeight: "92vh" }}>
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5" style={{ maxHeight: "92vh" }}>
          {/* Top accent + progress */}
          <div className="flex-none">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="flex-none bg-slate-900 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/30">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Tambah Akun Baru</h2>
                    <p className="text-xs text-slate-400">Langkah {step} dari 2</p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Steps indicator */}
              <div className="mt-4 flex items-center gap-2">
                {[1, 2].map((s) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold transition-all ${step >= s ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                      {step > s ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : s}
                    </div>
                    <span className={`text-xs font-medium ${step >= s ? "text-emerald-400" : "text-slate-500"}`}>
                      {s === 1 ? "Informasi Dasar" : "Akses Checksheet"}
                    </span>
                    {s < 2 && <div className={`h-px flex-1 rounded transition-colors ${step > s ? "bg-emerald-500" : "bg-slate-700"}`} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5">
                <svg className="h-4 w-4 flex-none text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Username" required><input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="contoh: john.doe" className={inputCls} /></Field>
                  <Field label="NIK" required><input type="text" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} placeholder="Nomor Induk Karyawan" className={`${inputCls} font-mono`} /></Field>
                </div>
                <Field label="Nama Lengkap" required><input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder="Nama lengkap pengguna" className={inputCls} /></Field>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Role" required>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className={selectCls}>
                      <option value="">-- Pilih Role --</option>
                      {VALID_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Departemen" required>
                    <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={selectCls}>
                      <option value="">-- Pilih Departemen --</option>
                      {VALID_DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Password" required>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Minimal 6 karakter" className={`${inputCls} pr-11`} />
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPw ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                      </button>
                    </div>
                  </Field>
                  <Field label="Konfirmasi Password" required>
                    <input type={showPw ? "text" : "password"} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Ulangi password" className={inputCls} />
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Akses Checksheet</p>
                    <p className="text-xs text-slate-500 mt-0.5"><span className="font-bold text-emerald-600">{formData.checksheets.length}</span> dari {VALID_CHECKSHEETS.length} dipilih</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFormData({ ...formData, checksheets: VALID_CHECKSHEETS.map((c) => c.key) })} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors">Semua</button>
                    <button onClick={() => setFormData({ ...formData, checksheets: [] })} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors">Kosong</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {VALID_CHECKSHEETS.map((cs) => {
                    const on = formData.checksheets.includes(cs.key);
                    return (
                      <button key={cs.key} type="button" onClick={() => toggleChecksheet(cs.key)} className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${on ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                        <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-md transition-colors ${on ? "bg-emerald-600" : "bg-slate-200"}`}>
                          {on && <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </span>
                        <span className={`text-sm font-medium ${on ? "text-emerald-700" : "text-slate-700"}`}>{cs.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 flex-none">
            {step === 2
              ? <button onClick={() => { setError(""); setStep(1); }} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all">← Kembali</button>
              : <div />
            }
            <div className="flex gap-3">
              <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all">Batal</button>
              {step === 1
                ? <button onClick={() => { setError(""); if (validate1()) setStep(2); }} className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-600 active:scale-[0.98] transition-all">Lanjut →</button>
                : <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-60 transition-all">
                  {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Membuat...</> : "✅ Buat Akun"}
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-in { animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400";
const selectCls = `${inputCls} cursor-pointer appearance-none`;

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}