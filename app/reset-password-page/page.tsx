// app/reset-password-page/page.tsx
"use client"

import { NavbarFixed } from "@/components/navbar-fixed"
import ResetPasswordForm from "@/components/auth/ResetPasswordForm"

export default function ResetPasswordPage() {
    return (
        <>
            <NavbarFixed />
            <div className="forgot-password-container">
                <div className="forgot-password-wrapper">
                    {/* Section Kiri - Info */}
                    <div className="forgot-password-text-section">
                        <div className="text-content">
                            <div className="icon-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <h1>Reset Password</h1>
                            <h2>Sistem E-Checksheet</h2>
                            <p>
                                Masukkan password baru Anda untuk mengamankan akun E-Checksheet Anda. Pastikan password baru Anda kuat dan tidak mudah ditebak.
                            </p>
                            <div className="feature-list">
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span>Minimal 6 karakter</span>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span>Kombinasi huruf, angka, & simbol</span>
                                </div>
                                <div className="feature-item">
                                    <div className="feature-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span>Keamanan data terjamin</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Kanan - Form */}
                    <div className="forgot-password-form-section">
                        <div className="forgot-password-card">
                            <ResetPasswordForm />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
