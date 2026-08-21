// app/forgot-password-page/page.tsx
"use client";

import { NavbarFixed } from "@/components/navbar-fixed";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <NavbarFixed />

      {/* Full-screen layout */}
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center px-4 py-20">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        {/* Grid noise */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 w-full max-w-4xl">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            {/* Left — branding */}
            <div className="hidden lg:block space-y-6 text-white">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/30">
                  <svg className="h-5 w-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-blue-100">E-Checksheet GA</span>
              </div>

              <div>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
                  Lupa<br />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Password?</span>
                </h1>
                <p className="mt-4 text-base leading-relaxed text-slate-300">
                  Jangan khawatir! Ajukan permohonan reset password kepada Admin. Request Anda akan ditinjau dan disetujui dalam waktu singkat.
                </p>
              </div>

              <ul className="space-y-3">
                {[
                  "Masukkan username akun Anda",
                  "Admin akan menerima notifikasi request",
                  "Setelah disetujui, Anda dapat membuat password baru",
                ].map((step, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">{i + 1}</span>
                    <span className="text-sm text-slate-300">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — card */}
            <div className="w-full">
              <div className="overflow-hidden rounded-3xl bg-white/95 shadow-2xl ring-1 ring-white/20 backdrop-blur-xl">
                {/* Top accent */}
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

                <div className="p-8">
                  {/* Header */}
                  <div className="mb-7">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                      <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
                    <p className="mt-1 text-sm text-slate-500">Ajukan permintaan reset ke Admin sistem</p>
                  </div>

                  <ForgotPasswordForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}