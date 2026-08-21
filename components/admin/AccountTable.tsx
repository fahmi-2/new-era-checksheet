"use client";

interface AccountTableUser {
  id: string;
  username: string;
  fullName: string;
  nik: string;
  department: string;
  role: string;
  isActive: boolean;
  checksheets: string[];
  createdAt: string;
  lastLogin: string | null;
  totalLogins: number;
}

interface AccountTableProps {
  users: AccountTableUser[];
  loading: boolean;
  onEdit: (user: AccountTableUser) => void;
  onDelete: (user: AccountTableUser) => void;
  onShowPassword: (user: AccountTableUser) => void;
}

const ROLE_META: Record<string, { label: string; className: string }> = {
  "group-leader-qa": { label: "GL QA", className: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  "inspector-qa": { label: "QA", className: "bg-blue-50 text-blue-700 ring-blue-600/20" },
  "inspector-ga": { label: "GA", className: "bg-teal-50 text-teal-700 ring-teal-600/20" },
  "inspector-ga-fire": { label: "GA · Fire", className: "bg-orange-50 text-orange-700 ring-orange-600/20" },
  "inspector-ga-equipment": { label: "GA · Equipment", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  "inspector-ga-electrical": { label: "GA · Electrical", className: "bg-yellow-50 text-yellow-700 ring-yellow-600/20" },
  "inspector-ga-personal": { label: "GA · Personal", className: "bg-lime-50 text-lime-700 ring-lime-600/20" },
  "inspector-ga-facility": { label: "GA · Facility", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  eso: { label: "ESO", className: "bg-cyan-50 text-cyan-700 ring-cyan-600/20" },
  admin: { label: "Admin", className: "bg-violet-50 text-violet-700 ring-violet-600/20" },
  superadmin: { label: "Super Admin", className: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20" },
};

const DEPT_LABELS: Record<string, string> = {
  quality: "Quality",
  qa: "QA",
  "general-affairs": "General Affairs",
  ga: "GA",
};

const CHECKSHEET_LABELS: Record<string, string> = {
  hydrant: "Hydrant",
  "selang-hydrant": "Selang Hydrant",
  "fire-alarm": "Fire Alarm",
  "smoke-detector": "Smoke Detector",
  apar: "APAR",
  "emergency-lamp": "Emergency Lamp",
  "exit-lamp-pintu-darurat": "Exit Lamp",
  "lift-barang": "Lift Barang",
  "inspeksi-preventif-lift-barang": "Insp. Lift",
  "tg-listrik": "Tangga Listrik",
  panel: "Panel Listrik",
  "form-inspeksi-stop-kontak": "Stop Kontak",
  "e-checksheet-apd": "APD",
  "inf-jalan": "Inf. Jalan",
  "inspeksi-apd": "Inspeksi APD",
  "checksheet-toilet": "Toilet",
};

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-cyan-600",
];

function getAvatarGradient(user: AccountTableUser) {
  const seed = (user.fullName.charCodeAt(0) || 0) + user.username.length;
  return AVATAR_GRADIENTS[seed % AVATAR_GRADIENTS.length];
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AccountTable({ users, loading, onEdit, onDelete, onShowPassword }: AccountTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-slate-900">Account Table</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums">
            {loading ? "…" : `${users.length} akun`}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-200/70 bg-slate-50/60">
              {["Pengguna", "NIK", "Role", "Dept", "Checksheet", "Status", "Login Terakhir", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:px-6"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          {loading ? (
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
                        <div className="h-2.5 w-24 rounded bg-slate-100 animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 md:px-6"><div className="h-3 w-24 rounded bg-slate-100 animate-pulse" /></td>
                  <td className="px-5 py-4 md:px-6"><div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" /></td>
                  <td className="px-5 py-4 md:px-6"><div className="h-3 w-24 rounded bg-slate-100 animate-pulse" /></td>
                  <td className="px-5 py-4 md:px-6"><div className="h-6 w-20 rounded-full bg-slate-100 animate-pulse" /></td>
                  <td className="px-5 py-4 md:px-6"><div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" /></td>
                  <td className="px-5 py-4 md:px-6"><div className="h-3 w-24 rounded bg-slate-100 animate-pulse" /></td>
                  <td className="px-5 py-4 md:px-6"><div className="h-8 w-20 rounded-lg bg-slate-100 animate-pulse ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          ) : users.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={8} className="px-5 py-20 md:px-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-inset ring-slate-200">
                      <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-900">Tidak ada akun ditemukan</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Coba ubah kata kunci pencarian atau atur ulang filter Anda.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const roleMeta = ROLE_META[user.role] || {
                  label: user.role,
                  className: "bg-slate-50 text-slate-700 ring-slate-200",
                };
                return (
                  <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                    {/* Pengguna */}
                    <td className="px-5 py-4 md:px-6">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(
                            user
                          )} text-xs font-bold text-white shadow-sm ring-2 ring-white`}
                        >
                          {(user.fullName?.charAt(0) || "?").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                          <p className="truncate text-xs text-slate-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* NIK */}
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 md:px-6">{user.nik || "—"}</td>

                    {/* Role */}
                    <td className="px-5 py-4 md:px-6">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${roleMeta.className}`}
                      >
                        {roleMeta.label}
                      </span>
                    </td>

                    {/* Dept */}
                    <td className="px-5 py-4 text-xs text-slate-600 md:px-6">
                      {DEPT_LABELS[user.department] || user.department || "—"}
                    </td>

                    {/* Checksheet */}
                    <td className="px-5 py-4 md:px-6">
                      {user.checksheets?.length ? (
                        <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
                          {user.checksheets.slice(0, 2).map((key) => (
                            <span
                              key={key}
                              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                            >
                              {CHECKSHEET_LABELS[key] || key}
                            </span>
                          ))}
                          {user.checksheets.length > 2 && (
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-600/20">
                              +{user.checksheets.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">Belum ada</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 md:px-6">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Login */}
                    <td className="px-5 py-4 md:px-6">
                      {user.lastLogin ? (
                        <div>
                          <p className="text-xs text-slate-700">{formatDate(user.lastLogin)}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                            {user.totalLogins}x login
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Belum pernah</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4 md:px-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Lihat password"
                          onClick={() => onShowPassword(user)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          title="Edit akun"
                          onClick={() => onEdit(user)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          title="Nonaktifkan akun"
                          onClick={() => onDelete(user)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-200/70 px-5 py-3 md:px-6">
        <p className="text-xs text-slate-500 tabular-nums">
          Menampilkan {loading ? "…" : users.length} akun
        </p>
        <p className="text-[11px] text-slate-400">E-Checksheet GA · Admin</p>
      </div>
    </div>
  );
}