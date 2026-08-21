"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";

export default function FormInspeksiStopKontakSelector() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!isAuthorizedForChecksheet(user)) {
      router.push("/home");
    }
  }, [user, router]);

  if (!user) return <div className="loading">Memuat...</div>;
  if (!isAuthorizedForChecksheet(user)) return null;

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <button
          className="back-btn"
          onClick={() => router.push("/status-ga")}
        >
          ← Kembali
        </button>

        <h1 className="title">🔌 Form Inspeksi Stop Kontak</h1>
        <p className="subtitle">Pilih jenis pengecekan:</p>

        <div className="card-grid">

          {/* Card A */}
          <div className="option-card-container">
            <button
              className="option-card"
              onClick={() =>
                router.push(
                  "/status-ga/form-inspeksi-stop-kontak/instalasi-listrik"
                )
              }
            >
              <span className="icon">⚡</span>
              <div className="text">
                <h2>A. Pengecekan Instalasi Listrik</h2>
                <p>Kabel, jalur, dan kerapihan instalasi listrik</p>
              </div>
            </button>

            <button
              className="history-btn"
              onClick={() =>
                router.push(
                  "/status-ga/form-inspeksi-stop-kontak/instalasi-listrik/riwayat"
                )
              }
            >
              📜 Lihat Riwayat
            </button>
          </div>

          {/* Card B */}
          <div className="option-card-container">
            <button
              className="option-card"
              onClick={() =>
                router.push(
                  "/status-ga/form-inspeksi-stop-kontak/stop-kontak"
                )
              }
            >
              <span className="icon">🔌</span>
              <div className="text">
                <h2>B. Pengecekan Stop Kontak</h2>
                <p>Kondisi fisik, keamanan, dan fungsi stop kontak</p>
              </div>
            </button>

            <button
              className="history-btn"
              onClick={() =>
                router.push(
                  "/status-ga/form-inspeksi-stop-kontak/stop-kontak/riwayat"
                )
              }
            >
              📜 Lihat Riwayat
            </button>
          </div>

        </div>
      </div>

      <style jsx>{`

        .app-page{
          border-top: none;
        }

        .back-btn {
          margin-bottom: 16px;
          padding: 8px 14px;
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 6px;
          color: #0d47a1;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: #bbdefb;
          border-color: #1e88e5;
        }

        .page-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px;
          background: #fafafa;
          min-height: 80vh;
          border: none;
          border-top: none;
          box-shadow: none;
        }

        .title {
          color: #0d47a1;
          font-size: 1.9rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #555;
          font-size: 1.05rem;
          margin-bottom: 36px;
          font-weight: 500;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 28px;
        }

        .option-card-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .option-card {
          display: flex;
          gap: 18px;
          padding: 28px;
          background: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          align-items: flex-start;
          text-align: left;
          flex: 1;
          border-left: 5px solid #1e88e5;
        }

        .option-card:hover {
          box-shadow: 0 6px 24px rgba(30, 136, 229, 0.18);
          transform: translateY(-4px);
          border-left-color: #1565c0;
        }

        .option-card .icon {
          font-size: 2.8rem;
          min-width: 70px;
          text-align: center;
        }

        .option-card .text h2 {
          margin: 0 0 8px 0;
          color: #0d47a1;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .option-card .text p {
          margin: 0;
          color: #666;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .history-btn {
          width: 100%;
          padding: 11px 16px;
          background: linear-gradient(135deg, #bbdefb 0%, #e1f5fe 100%);
          border: 1.5px solid #64b5f6;
          border-radius: 8px;
          color: #0d47a1;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .history-btn:hover {
          background: linear-gradient(135deg, #90caf9 0%, #bbdefb 100%);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.18);
          border-color: #1e88e5;
        }

      `}</style>
    </div>
  );
}