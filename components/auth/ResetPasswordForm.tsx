// components/auth/ResetPasswordForm.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function ResetPasswordForm() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")
    const [passwordStrength, setPasswordStrength] = useState(0)

    // Cek kekuatan password
    useEffect(() => {
        let strength = 0
        if (password.length >= 8) strength++
        if (/[A-Z]/.test(password)) strength++
        if (/[a-z]/.test(password)) strength++
        if (/[0-9]/.test(password)) strength++
        if (/[^A-Za-z0-9]/.test(password)) strength++
        setPasswordStrength(strength)
    }, [password])

    const getStrengthText = () => {
        if (password.length === 0) return { text: "", color: "#e5e7eb" }
        if (passwordStrength <= 2) return { text: "Lemah", color: "#ef4444" }
        if (passwordStrength === 3) return { text: "Sedang", color: "#f59e0b" }
        if (passwordStrength === 4) return { text: "Kuat", color: "#10b981" }
        return { text: "Sangat Kuat", color: "#059669" }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setMessage("")

        if (!username.trim()) {
            setError("Username wajib diisi")
            return
        }

        if (password.length < 6) {
            setError("Password minimal 6 karakter")
            return
        }

        if (password !== confirmPassword) {
            setError("Konfirmasi password tidak cocok")
            return
        }

        setLoading(true)

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username.trim(),
                    newPassword: password,
                    confirmPassword,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Gagal reset password.")
            }

            setMessage(data.message || "Password berhasil direset! Anda dapat login sekarang.")
            setPassword("")
            setConfirmPassword("")
            setUsername("")

            setTimeout(() => {
                window.location.href = "/e-checksheet-ga/login-page"
            }, 2500)
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan. Silakan coba lagi.")
        } finally {
            setLoading(false)
        }
    }

    const strengthInfo = getStrengthText()

    return (
        <div className="reset-password-form-wrapper">
            <div className="reset-password-card-header">
                <h2>Reset Password</h2>
                <p>Buat password baru yang aman untuk akun Anda</p>
            </div>

            <form className="reset-password-form" onSubmit={handleSubmit}>
                {/* Username Field */}
                <div className="reset-input-wrapper">
                    <label htmlFor="username">Username</label>
                    <div className="reset-input-field">
                        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
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

                {/* Password Field */}
                <div className="reset-input-wrapper">
                    <label htmlFor="password">Password Baru</label>
                    <div className="reset-input-field">
                        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Minimal 6 karakter"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                            className="toggle-password-btn"
                            disabled={loading}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password.length > 0 && (
                        <div className="password-strength-container">
                            <div className="strength-bars">
                                <div
                                    className={`strength-bar ${passwordStrength >= 1 ? "active" : ""}`}
                                    style={{ backgroundColor: passwordStrength >= 1 ? strengthInfo.color : "#e5e7eb" }}
                                ></div>
                                <div
                                    className={`strength-bar ${passwordStrength >= 2 ? "active" : ""}`}
                                    style={{ backgroundColor: passwordStrength >= 2 ? strengthInfo.color : "#e5e7eb" }}
                                ></div>
                                <div
                                    className={`strength-bar ${passwordStrength >= 3 ? "active" : ""}`}
                                    style={{ backgroundColor: passwordStrength >= 3 ? strengthInfo.color : "#e5e7eb" }}
                                ></div>
                                <div
                                    className={`strength-bar ${passwordStrength >= 4 ? "active" : ""}`}
                                    style={{ backgroundColor: passwordStrength >= 4 ? strengthInfo.color : "#e5e7eb" }}
                                ></div>
                                <div
                                    className={`strength-bar ${passwordStrength >= 5 ? "active" : ""}`}
                                    style={{ backgroundColor: passwordStrength >= 5 ? strengthInfo.color : "#e5e7eb" }}
                                ></div>
                            </div>
                            <span className="strength-text" style={{ color: strengthInfo.color }}>
                                {strengthInfo.text}
                            </span>
                        </div>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div className="reset-input-wrapper">
                    <label htmlFor="confirmPassword">Konfirmasi Password</label>
                    <div className="reset-input-field">
                        <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <polyline points="9 12 11 14 15 10"></polyline>
                        </svg>
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Ulangi password baru Anda"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                            className="toggle-password-btn"
                            disabled={loading}
                        >
                            {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </div>
                    {confirmPassword.length > 0 && password !== confirmPassword && (
                        <div className="password-match-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            Password tidak cocok
                        </div>
                    )}
                    {confirmPassword.length > 0 && password === confirmPassword && password.length >= 6 && (
                        <div className="password-match-success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Password cocok
                        </div>
                    )}
                </div>

                {error && (
                    <div className="reset-error-message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                    </div>
                )}

                {message && (
                    <div className="reset-success-message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        {message}
                    </div>
                )}

                <button type="submit" className="reset-auth-btn" disabled={loading}>
                    {loading ? (
                        <>
                            <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 6v6l4 2"></path>
                            </svg>
                            Mereset...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            Reset Password
                        </>
                    )}
                </button>
            </form>

            <div className="reset-switch-link">
                <Link href="/e-checksheet-ga/login-page" className="back-to-login">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Kembali ke Login
                </Link>
            </div>
        </div>
    )
}
