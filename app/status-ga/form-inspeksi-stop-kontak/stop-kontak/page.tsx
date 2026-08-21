// app/status-ga/form-inspeksi-stop-kontak/stop-kontak/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isAuthorizedForChecksheet } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { useConnection } from "@/lib/connection-context";
import { smartFetch } from "@/lib/smart-fetch";
import { QrCode } from "lucide-react";

// ✅ TAMBAHKAN IMPORT HOOK SCAN VERIFICATION
import { useScanVerification } from "@/lib/hooks/useScanVerification";

const checklistStopKontak = [
  {
    no: 1,
    item: "Kondisi Fisik Stop Kontak",
    detail: "Tidak retak, pecah, atau longgar",
  },
  {
    no: 2,
    item: "Penutup Stop Kontak",
    detail: "Penutup terpasang dan aman",
  },
  {
    no: 3,
    item: "Fungsi Stop Kontak",
    detail: "Berfungsi dengan baik saat diuji",
  },
  {
    no: 4,
    item: "Keamanan",
    detail: "Tidak panas dan tidak berbau",
  },
];

type CheckData = {
  hasil: "OK" | "NOK" | "";
  keterangan: string;
};

export default function FormStopKontak() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, pendingCount } = useConnection();
  
  // ✅ TAMBAHKAN HOOK INI - WAJIB DI TOP LEVEL
  const { isScanned, isLoading: scanLoading } = useScanVerification();
  
  const [meta, setMeta] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    area: "",
    pic: user?.fullName || "",
  });

  const [checkData, setCheckData] = useState<Record<number, CheckData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!isAuthorizedForChecksheet(user)) {
      router.push("/home");
    }
  }, [user, router]);

  const toggleExpand = (no: number) => {
    setExpandedItem(expandedItem === no ? null : no);
  };

  if (!user) return <div className="loading">Memuat...</div>;
  if (!isAuthorizedForChecksheet(user)) return null;

  const handleResultChange = (no: number, hasil: "OK" | "NOK") => {
    setCheckData(prev => ({
      ...prev,
      [no]: { ...prev[no], hasil }
    }));
  };

  const handleKeteranganChange = (no: number, keterangan: string) => {
    setCheckData(prev => ({
      ...prev,
      [no]: { ...prev[no], keterangan }
    }));
  };

  const handleSubmit = async () => {
    if (!meta.area.trim()) {
      alert("❗ Area harus diisi");
      return;
    }

    const allChecked = checklistStopKontak.every(item => checkData[item.no]?.hasil);
    if (!allChecked) {
      alert("❗ Semua item harus diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: "stop-kontak",
        tanggal: meta.tanggal,
        area: meta.area,
        pic: meta.pic,
        items: checkData,
        additional_notes: ""
      };

      const response = await smartFetch('/e-checksheet-ga/api/electrical_inspections/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        queueType: 'electrical_inspection',
        metadata: { areaCode: 'stop-kontak' }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan data');
      }

      alert("✅ Data berhasil disimpan!");
      router.push("/status-ga/form-inspeksi-stop-kontak/stop-kontak/riwayat");
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`❌ ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-page">
      <Sidebar userName={user.fullName} />

      <div className="page-content">
        <button
          onClick={() => router.back()}
          className="back-btn"
        >
          ← Kembali
        </button>

        <h1 className="title">🔌 Pengecekan Stop Kontak</h1>

        {/* ✅ SCAN WARNING BANNER - TAMBAHAN BARU */}
        {!isScanned && (
          <div className="banner banner-warning scan-warning">
            <span>🔒 Akses melalui scan QR code terlebih dahulu untuk mengisi checksheet ini.</span>
            <button 
              onClick={() => router.push("/scan")} 
              className="banner-btn"
              disabled={isSubmitting}
            >
              <QrCode size={14} /> Scan Sekarang
            </button>
          </div>
        )}

        {/* Form Header */}
        <div className="form-header">
          <div className="form-group">
            <label>Tanggal</label>
            <input
              type="date"
              value={meta.tanggal}
              onChange={(e) => setMeta({ ...meta, tanggal: e.target.value })}
              className="form-input"
              disabled={!isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
            />
          </div>
          <div className="form-group">
            <label>Area</label>
            <input
              type="text"
              placeholder="Masukkan area..."
              value={meta.area}
              onChange={(e) => setMeta({ ...meta, area: e.target.value })}
              className="form-input"
              disabled={!isScanned}
              title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
            />
          </div>
          <div className="form-group">
            <label>PIC</label>
            <input
              type="text"
              placeholder="Person in Charge"
              value={meta.pic}
              onChange={(e) => setMeta({ ...meta, pic: e.target.value })}
              className="form-input"
              disabled
            />
          </div>
        </div>

        {/* ✅ DESKTOP: Table View */}
        <div className="desktop-view">
          <table className="checksheet">
            <thead>
              <tr>
                <th>No</th>
                <th>Item Pengecekan</th>
                <th>Detail</th>
                <th>OK</th>
                <th>N-OK</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {checklistStopKontak.map((row) => (
                <tr key={row.no}>
                  <td className="no-cell">{row.no}</td>
                  <td>{row.item}</td>
                  <td>{row.detail}</td>
                  <td className="radio-cell">
                    <input
                      type="radio"
                      name={`hasil-${row.no}`}
                      checked={checkData[row.no]?.hasil === "OK"}
                      onChange={() => handleResultChange(row.no, "OK")}
                      className="radio-input"
                      disabled={!isScanned}
                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                    />
                  </td>
                  <td className="radio-cell">
                    <input
                      type="radio"
                      name={`hasil-${row.no}`}
                      checked={checkData[row.no]?.hasil === "NOK"}
                      onChange={() => handleResultChange(row.no, "NOK")}
                      className="radio-input"
                      disabled={!isScanned}
                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Catatan..."
                      value={checkData[row.no]?.keterangan || ""}
                      onChange={(e) => handleKeteranganChange(row.no, e.target.value)}
                      className="text-input"
                      disabled={!isScanned}
                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ✅ MOBILE: Card View */}
        <div className="mobile-view">
          {checklistStopKontak.map((row) => (
            <div key={row.no} className="inspection-card">
              <div 
                className="card-header"
                onClick={() => toggleExpand(row.no)}
              >
                <div className="card-no">{row.no}</div>
                <div className="card-info">
                  <div className="card-item">{row.item}</div>
                  <div className="card-detail">{row.detail}</div>
                </div>
                <div className={`expand-icon ${expandedItem === row.no ? 'expanded' : ''}`}>
                  {expandedItem === row.no ? '▲' : '▼'}
                </div>
              </div>

              {expandedItem === row.no && (
                <div className="card-body">
                  <div className="form-group-mobile">
                    <label className="form-label">Hasil Pengecekan</label>
                    <div className="radio-group-mobile">
                      <label className={`radio-label ${!isScanned ? 'disabled' : ''}`}
                        title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                        <input
                          type="radio"
                          name={`hasil-mobile-${row.no}`}
                          checked={checkData[row.no]?.hasil === "OK"}
                          onChange={() => handleResultChange(row.no, "OK")}
                          className="radio-input-mobile"
                          disabled={!isScanned}
                        />
                        <span className="radio-text ok">OK</span>
                      </label>
                      <label className={`radio-label ${!isScanned ? 'disabled' : ''}`}
                        title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}>
                        <input
                          type="radio"
                          name={`hasil-mobile-${row.no}`}
                          checked={checkData[row.no]?.hasil === "NOK"}
                          onChange={() => handleResultChange(row.no, "NOK")}
                          className="radio-input-mobile"
                          disabled={!isScanned}
                        />
                        <span className="radio-text ng">N-OK</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group-mobile">
                    <label className="form-label">Keterangan</label>
                    <input
                      type="text"
                      placeholder="Catatan..."
                      value={checkData[row.no]?.keterangan || ""}
                      onChange={(e) => handleKeteranganChange(row.no, e.target.value)}
                      className="text-input-mobile"
                      disabled={!isScanned}
                      title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="actions">
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting || !isScanned}
            title={!isScanned ? "Harap scan QR code terlebih dahulu" : ""}
          >
            {isSubmitting ? '⏳ Menyimpan...' : '💾 Simpan Checksheet'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .app-page {
          display: flex;
          min-height: 100vh;
          background: #f5f7fa;
        }

        .page-content {
          flex: 1;
          width: calc(100% - 280px);
          margin-left: 280px;
          padding: 24px;
          overflow-x: hidden;
        }

        .back-btn {
          background: white;
          border: 1.5px solid #e0e0e0;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 24px;
          font-weight: 600;
          color: #1565c0;
          transition: all 0.3s ease;
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .back-btn:hover {
          background: #f5f5f5;
          border-color: #1565c0;
          transform: translateX(-2px);
          box-shadow: 0 2px 6px rgba(21, 101, 192, 0.15);
        }

        .title {
          margin-bottom: 24px;
          color: #0d47a1;
          font-size: 1.8rem;
          font-weight: 700;
        }

        /* ── Banners ────────────────────────────────────── */
        .banner {
          border-radius: 10px; padding: 12px 18px; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px; font-weight: 500;
        }
        .banner-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b; color: #92400e;
          box-shadow: 0 2px 8px rgba(245,158,11,0.12);
        }
        .banner-btn {
          margin-left: auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white; border: none; border-radius: 7px; padding: 8px 16px;
          cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(245,158,11,0.3);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
        }
        .banner-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(245,158,11,0.4); }
        .scan-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b; justify-content: space-between;
        }
        .scan-warning .banner-btn {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          padding: 8px 16px;
        }
        .scan-warning .banner-btn:hover {
          transform: translateY(-1px); box-shadow: 0 4px 10px rgba(124, 58, 237, 0.4);
        }

        .form-header {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 200px;
        }

        .form-group label {
          font-weight: 600;
          color: #1a237e;
          font-size: 0.95rem;
        }

        .form-input {
          padding: 11px 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: white;
          min-height: 44px;
          color : #1e293b;
        }

        .form-input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }

        .form-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        /* Desktop View */
        .desktop-view {
          display: block;
        }

        .mobile-view {
          display: none;
        }

        .checksheet {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }

        .checksheet th,
        .checksheet td {
          border: 1px solid #f0f0f0;
          padding: 16px;
          font-size: 0.95rem;
          text-align: left;
        }

        .checksheet th {
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          font-weight: 600;
          color: white;
        }

        .checksheet tbody tr {
          transition: background-color 0.2s ease;
        }

        .checksheet tbody tr:hover {
          background-color: #f8f9fa;
        }

        .no-cell {
          width: 60px;
          text-align: center;
          font-weight: 600;
          color: #1565c0;
        }

        .radio-cell {
          width: 70px;
          text-align: center;
        }

        .radio-input {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #1e88e5;
        }

        .radio-input:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .text-input {
          width: 100%;
          padding: 11px 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          background: white;
          min-height: 44px;
        }

        .text-input:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }

        .text-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        /* Mobile Card Styles */
        .inspection-card {
          background: white;
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e0e0e0;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8eaf6 100%);
          transition: background 0.2s;
          min-height: 44px;
        }

        .card-header:hover {
          background: linear-gradient(135deg, #e8eaf6 0%, #d1c4e9 100%);
        }

        .card-no {
          width: 36px;
          height: 36px;
          background: #1e88e5;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .card-info {
          flex: 1;
          min-width: 0;
        }

        .card-item {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .card-detail {
          font-size: 0.8rem;
          color: #64748b;
        }

        .expand-icon {
          font-size: 1.2rem;
          color: #64748b;
          transition: transform 0.3s ease;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .card-body {
          padding: 16px;
          background: #fafbfc;
        }

        .form-group-mobile {
          margin-bottom: 16px;
        }

        .form-group-mobile:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #475569;
          font-size: 0.9rem;
        }

        .radio-group-mobile {
          display: flex;
          gap: 16px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          min-height: 44px;
          padding: 8px 12px;
          border-radius: 8px;
          background: white;
          border: 1.5px solid #e0e0e0;
          transition: all 0.2s;
        }

        .radio-label:hover:not(.disabled) {
          border-color: #1e88e5;
        }

        .radio-label.disabled {
          background: #f5f5f5;
          cursor: not-allowed;
          border-color: #e0e0e0;
        }

        .radio-input-mobile {
          width: 20px;
          height: 20px;
          accent-color: #1e88e5;
        }

        .radio-input-mobile:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .radio-text {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .radio-text.ok {
          color: #2e7d32;
        }

        .radio-text.ng {
          color: #c62828;
        }

        .text-input-mobile {
          width: 100%;
          padding: 11px 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          background: white;
          min-height: 44px;
        }

        .text-input-mobile:focus {
          outline: none;
          border-color: #1e88e5;
          box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
          background: #f8fbff;
        }

        .text-input-mobile:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .submit-btn {
          padding: 13px 36px;
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
          min-height: 48px;
        }

        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(30, 136, 229, 0.35);
          transform: translateY(-2px);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* ✅ TABLET RESPONSIVE (768px - 1024px) */
        @media (max-width: 1024px) {
          .page-content {
            padding: 20px 16px;
          }

          .title {
            font-size: 1.6rem;
          }

          .checksheet {
            font-size: 0.9rem;
          }

          .checksheet th,
          .checksheet td {
            padding: 12px 8px;
          }
        }

        /* ✅ MOBILE RESPONSIVE (≤ 768px) */
        @media (max-width: 768px) {
          .page-content {
            width: 100%;
            margin-left: 0;
            padding: 16px 12px;
          }

          .back-btn {
            width: 100%;
            justify-content: center;
            min-height: 48px;
          }

          .title {
            font-size: 1.4rem;
            margin-bottom: 20px;
          }

          .form-header {
            padding: 16px;
            flex-direction: column;
            gap: 12px;
          }

          .form-group {
            width: 100%;
            min-width: 100%;
          }

          .form-input {
            font-size: 0.9rem;
          }

          /* Hide desktop table, show mobile cards */
          .desktop-view {
            display: none;
          }

          .mobile-view {
            display: block;
          }

          .card-header {
            padding: 14px 12px;
          }

          .card-no {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }

          .card-item {
            font-size: 0.9rem;
          }

          .card-detail {
            font-size: 0.75rem;
          }

          .card-body {
            padding: 14px 12px;
          }

          .form-label {
            font-size: 0.85rem;
          }

          .radio-group-mobile {
            flex-direction: column;
            gap: 8px;
          }

          .radio-label {
            min-height: 44px;
          }

          .text-input-mobile {
            font-size: 0.9rem;
            min-height: 44px;
          }

          .actions {
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
          }

          .submit-btn {
            width: 100%;
            padding: 14px 24px;
            font-size: 1rem;
            min-height: 52px;
          }
        }

        /* ✅ SMALL MOBILE (≤ 480px) */
        @media (max-width: 480px) {
          .page-content {
            padding: 12px 8px;
          }

          .back-btn {
            padding: 10px 14px;
            font-size: 0.9rem;
            min-height: 44px;
          }

          .title {
            font-size: 1.2rem;
            margin-bottom: 16px;
          }

          .form-header {
            padding: 12px;
            gap: 10px;
          }

          .form-group label {
            font-size: 0.85rem;
          }

          .form-input {
            font-size: 0.85rem;
            padding: 10px 11px;
          }

          .card-header {
            padding: 12px 10px;
          }

          .card-no {
            width: 28px;
            height: 28px;
            font-size: 0.85rem;
          }

          .card-item {
            font-size: 0.85rem;
          }

          .card-detail {
            font-size: 0.7rem;
          }

          .card-body {
            padding: 12px 10px;
          }

          .form-label {
            font-size: 0.8rem;
            margin-bottom: 6px;
          }

          .radio-label {
            padding: 10px;
            font-size: 0.9rem;
          }

          .radio-text {
            font-size: 0.9rem;
          }

          .text-input-mobile {
            font-size: 0.85rem;
            padding: 10px 11px;
            min-height: 44px;
          }

          .submit-btn {
            padding: 12px 20px;
            font-size: 0.95rem;
            min-height: 52px;
          }
        }

        /* ✅ EXTRA SMALL MOBILE (≤ 360px) */
        @media (max-width: 360px) {
          .page-content {
            padding: 10px 6px;
          }

          .title {
            font-size: 1.1rem;
          }

          .back-btn {
            font-size: 0.85rem;
            padding: 8px 12px;
            min-height: 40px;
          }

          .form-header {
            padding: 10px;
          }

          .card-header {
            padding: 10px 8px;
          }

          .card-no {
            width: 26px;
            height: 26px;
            font-size: 0.8rem;
          }

          .card-item {
            font-size: 0.8rem;
          }

          .radio-label {
            padding: 8px;
          }

          .text-input-mobile {
            font-size: 0.8rem;
            padding: 9px 10px;
          }

          .submit-btn {
            padding: 11px 18px;
            font-size: 0.9rem;
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
}