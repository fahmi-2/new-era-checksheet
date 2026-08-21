"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

export default function InspeksiPreventifLiftBarangSelector() {
  const router = useRouter();
  const { user } = useAuth()
  const [redirected, setRedirected] = useState(false);

  // Redirect jika tidak punya akses
  useEffect(() => {
    if (redirected) return;
    if (!user) return;
    if (!isAuthorizedForChecksheet(user)) {
      setRedirected(true);
      router.push("/home");
    }
  }, [user, router, redirected]);

  // Tampilkan loading saat auth belum siap
  if (!user) {
    return <div className="loading">Memuat...</div>;
  }

  // Jika user bukan inspector-ga, jangan render apa-apa
  if (!isAuthorizedForChecksheet(user)) {
    return null;
  }

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <div className="header-section">
          <button onClick={() => router.push("/status-ga")} className="btn-back">← Kembali</button>
        </div>

        <h1 className="title">📋 Inspeksi & Preventif Lift Barang</h1>
        <p className="subtitle">Pilih jenis checksheet yang ingin diisi:</p>

        <div className="card-grid">
          <button
            onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang/inspeksi")}
            className="option-card"
          >
            <span className="icon">🔍</span>
            <div className="text">
              <h2>A. Inspeksi Lift Barang (3 Bulanan)</h2>
              <p>Pengecekan visual & fungsional komponen lift</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/status-ga/inspeksi-preventif-lift-barang/preventif")}
            className="option-card"
          >
            <span className="icon">🔧</span>
            <div className="text">
              <h2>B. Preventive Lift Barang</h2>
              <p>Tindakan perawatan berkala (pelumasan, pengujian, dll.)</p>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        .app-page {
          background: #f5f7fa;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
          color: #555;
        }

        .page-content {
          max-width: 800px;
          margin: 40px auto;
          padding: 24px;
          text-align: center;
        }

        .header-section {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 24px;
        }

        .btn-back {
          padding: 10px 20px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
        }

        .btn-back:hover {
          background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
          transform: translateY(-2px);
        }

        .btn-back:active {
          transform: translateY(0);
        }

        .title {
          color: #0d47a1;
          font-size: 2rem;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .subtitle {
          color: #666;
          margin-bottom: 32px;
          font-size: 1.1rem;
        }

        .card-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .option-card {
          display: flex;
          align-items: center;
          background: white;
          border: 2px solid #1e88e5;
          border-radius: 8px;
          padding: 20px 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .option-card:hover {
          background: #e3f2fd;
          border-color: #0d47a1;
        }

        .icon {
          font-size: 1.5rem;
          color: #1e88e5;
          margin-right: 12px;
        }

        .text h2 {
          margin: 0 0 4px;
          color: #0d47a1;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .text p {
          margin: 0;
          color: #555;
          font-size: 0.95rem;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}