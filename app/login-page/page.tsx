// app/login-page/page.tsx
"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { NavbarFixed } from "@/components/navbar-fixed"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // ✅ Tambahkan state untuk toggle
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await login(username, password) // ✅ await di sini
      if (result.success) {
        router.push("/home")
      } else {
        setError(result.error || "Login gagal!")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat login")
    } finally {
      setLoading(false)
    }
  }


  return (
    <>
      <NavbarFixed />
      <div className="login-container">
        <div className="login-wrapper">
          <div className="login-text-section">
            <h1>Selamat Datang</h1>
            <h2>Sistem E-Checksheet</h2>
            <p>
              Kelola checklist Anda dengan efisien menggunakan platform digital kami. Akses mudah, monitoring real-time,
              dan laporan komprehensif.
            </p>

          </div>

          <div className="login-form-section">
            <div className="login-card">
              <div className="login-card-header">
                <h2>Login</h2>
                <p>Masuk ke akun Anda</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-wrapper">
                  <label htmlFor="username">Username</label>
                  <div className="input-field">
                    <input
                      id="username"
                      type="text"
                      placeholder="Masukkan username Anda"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="input-wrapper">
                  <label htmlFor="password">Password</label>
                  <div className="input-field" style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"} // ✅ Ganti type dinamis
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      style={{ paddingRight: "40px" }} // ✅ Beri ruang untuk icon
                    />
                    {/* ✅ Tombol toggle show password */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                      }}
                      disabled={loading}
                    >
                      {showPassword ? (
                        // Icon mata dicoret (hide)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        // Icon mata terbuka (show)
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="switch-link">
                Belum punya akun?, Silahkan hubungi Admin.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}