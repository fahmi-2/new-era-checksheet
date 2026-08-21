// components/admin/DeleteConfirmModal.tsx
"use client";

import { User } from "@/app/admin/accounts/page";

interface Props {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ user, onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Glass card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          {/* Danger stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-orange-500" />

          <div className="p-6">
            {/* Icon */}
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-rose-100 ring-1 ring-rose-200">
                <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Nonaktifkan Akun</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Pengguna tidak akan bisa login setelah ini.
                </p>
              </div>
            </div>

            {/* User card */}
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 ring-1 ring-inset ring-slate-200">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white ring-2 ring-white shadow-md">
                {(user.fullName?.charAt(0) || "U").toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                <p className="truncate text-xs text-slate-500">
                  <span className="font-mono">@{user.username}</span>
                  {user.nik && <> &middot; {user.nik}</>}
                </p>
              </div>
            </div>

            {/* Info list */}
            <ul className="mb-6 space-y-2 text-sm text-slate-600">
              {[
                "Pengguna tidak akan dapat login ke sistem",
                "Data checksheet yang sudah diisi tetap tersimpan",
                "Akun dapat diaktifkan kembali oleh admin kapan saja",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-none text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-500/25 transition-all hover:from-rose-600 hover:to-red-700 hover:shadow-rose-500/40 active:scale-[0.98]"
              >
                Nonaktifkan
              </button>
            </div>
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