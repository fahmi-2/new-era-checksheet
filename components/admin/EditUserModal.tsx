// components/admin/EditUserModal.tsx
"use client";

import { useState } from "react";
import { User, VALID_CHECKSHEETS } from "@/app/admin/accounts/page";

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
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = "info" | "password" | "checksheets";

export function EditUserModal({ user, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    username: user.username,
    fullName: user.fullName,
    nik: user.nik,
    department: user.department,
    role: user.role,
    newPassword: "",
    confirmPassword: "",
    isActive: user.isActive,
    checksheets: [...user.checksheets],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("info");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!formData.username.trim() || !formData.fullName.trim() || !formData.nik.trim()) {
      setError("Username, Nama Lengkap, dan NIK wajib diisi!"); return;
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("Password baru minimal 6 karakter!"); return;
    }
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError("Password dan konfirmasi tidak cocok!"); return;
    }
    setLoading(true);
    try {
      const userStr = localStorage.getItem("auth_current_user_v2");
      let userRole = "";
      if (userStr) { try { userRole = JSON.parse(userStr).role || ""; } catch { } }
      if (!userRole) userRole = localStorage.getItem("userRole") || "admin";

      const body: any = {
        username: formData.username.trim(), fullName: formData.fullName.trim(),
        nik: formData.nik.trim(), department: formData.department,
        role: formData.role, isActive: formData.isActive, checksheets: formData.checksheets,
      };
      if (formData.newPassword) body.newPassword = formData.newPassword;

      const res = await fetch(`/e-checksheet-ga/api/auth/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-role": userRole },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { throw new Error(`Respon server tidak valid (${res.status})`); }
      if (data.success) { onSuccess(); } else { setError(data.error || "Gagal mengupdate akun"); }
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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "info", label: "Info",
      icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
      key: "password", label: "Password",
      icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    },
    {
      key: "checksheets", label: "Checksheet",
      icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative flex w-full max-w-2xl flex-col animate-scale-in" style={{ maxHeight: "92vh" }}>
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5" style={{ maxHeight: "92vh" }}>
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 flex-none" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 flex-none">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md">
                {(user.fullName?.charAt(0) || "U").toUpperCase()}
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Edit Akun</h2>
                <p className="text-xs text-slate-500">{user.fullName} · <span className="font-mono">@{user.username}</span></p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 px-6 flex-none">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${tab === t.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                {t.icon}
                {t.label}
                {t.key === "checksheets" && (
                  <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
                    {formData.checksheets.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Body (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {error && (
              <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5">
                <svg className="h-4 w-4 flex-none text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            {/* INFO TAB */}
            {tab === "info" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Username" required>
                    <input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="NIK" required>
                    <input value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className={`${inputCls} font-mono`} />
                  </Field>
                </div>
                <Field label="Nama Lengkap" required>
                  <input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className={inputCls} />
                </Field>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Role">
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className={selectCls}>
                      {VALID_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Departemen">
                    <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={selectCls}>
                      {VALID_DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Status toggle */}
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-inset ring-slate-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Status Akun</p>
                    <p className="text-xs text-slate-500">
                      {formData.isActive ? "Pengguna dapat login ke sistem" : "Akun dinonaktifkan"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative h-7 w-13 rounded-full transition-colors duration-200 ${formData.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                    style={{ minWidth: 52 }}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${formData.isActive ? "translate-x-6" : "translate-x-0.5"}`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* PASSWORD TAB */}
            {tab === "password" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-inset ring-amber-200">
                  <svg className="mt-0.5 h-4 w-4 flex-none text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-amber-700">Kosongkan field di bawah jika tidak ingin mengubah password.</p>
                </div>
                <Field label="Password Baru">
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className={`${inputCls} pr-11`}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPw
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                        }
                      </svg>
                    </button>
                  </div>
                </Field>
                <Field label="Konfirmasi Password Baru">
                  <input
                    type={showPw ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Ulangi password baru"
                    className={inputCls}
                  />
                </Field>
              </div>
            )}

            {/* CHECKSHEETS TAB */}
            {tab === "checksheets" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-indigo-600">{formData.checksheets.length}</span>
                    {" "}dari {VALID_CHECKSHEETS.length} checksheet dipilih
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setFormData({ ...formData, checksheets: VALID_CHECKSHEETS.map((c) => c.key) })} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors">Semua</button>
                    <button onClick={() => setFormData({ ...formData, checksheets: [] })} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors">Kosong</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {VALID_CHECKSHEETS.map((cs) => {
                    const on = formData.checksheets.includes(cs.key);
                    return (
                      <button
                        key={cs.key}
                        type="button"
                        onClick={() => toggleChecksheet(cs.key)}
                        className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${on ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-md transition-colors ${on ? "bg-indigo-600" : "bg-slate-200"}`}>
                          {on && <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </span>
                        <span className={`text-sm font-medium ${on ? "text-indigo-700" : "text-slate-700"}`}>{cs.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 flex-none">
            <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all">
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-60 transition-all"
            >
              {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menyimpan...</> : "💾 Simpan"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .animate-scale-in { animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400";
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