// components/ScanAreaRequired.tsx
"use client";
import { useRouter } from "next/navigation";
import { QrCode, ArrowLeft, AlertCircle } from "lucide-react";

interface ScanAreaRequiredProps {
  title: string;
  checksheetType: string;
  description?: string;
  areaName?: string;
  icon?: React.ReactNode;
}

/**
 * Komponen untuk menampilkan halaman "Scan Required"
 * Ditampilkan ketika user mencoba akses checksheet tanpa scan QR code
 * 
 * Dengan mode ini, user hanya bisa:
 * - Melihat informasi checksheet (READ-ONLY)
 * - Kembali ke halaman sebelumnya
 * - Pergi ke halaman scan untuk mem-scan QR code
 */
export function ScanAreaRequired({
  title,
  checksheetType,
  description,
  areaName,
  icon,
}: ScanAreaRequiredProps) {
  const router = useRouter();

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />
      
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button 
            onClick={() => router.back()}
            style={styles.backBtn}
            title="Kembali"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={styles.title}>{title}</h1>
          <div style={{ width: 40 }} />
        </div>

        {/* Main Card */}
        <div style={styles.card}>
          {/* Icon */}
          <div style={styles.iconContainer}>
            <QrCode size={60} color="#ff6b6b" />
          </div>

          {/* Alert */}
          <div style={styles.alertBox}>
            <AlertCircle size={24} color="#ff6b6b" style={{ marginRight: 12 }} />
            <div>
              <div style={styles.alertTitle}>⚠️ Scan Diperlukan</div>
              <div style={styles.alertText}>
                Silakan scan QR code terlebih dahulu untuk memulai pengisian checksheet
              </div>
            </div>
          </div>

          {/* Info */}
          {(description || areaName) && (
            <div style={styles.infoBox}>
              {areaName && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Area/Zona:</span>
                  <span style={styles.infoValue}>{areaName}</span>
                </div>
              )}
              {description && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Jenis:</span>
                  <span style={styles.infoValue}>{description}</span>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          <div style={styles.messageBox}>
            <p style={styles.message}>
              <strong>Mode: READ-ONLY</strong>
            </p>
            <p style={styles.messageSmall}>
              Anda sedang melihat halaman checksheet dalam mode read-only. 
              Untuk mengisi checksheet, Anda harus:
            </p>
            <ol style={styles.list}>
              <li>Buka halaman <strong>SCAN QR CODE</strong></li>
              <li>Scan QR code untuk checksheet ini</li>
              <li>Anda akan dapat mengisi checksheet setelah scan berhasil</li>
            </ol>
          </div>

          {/* Buttons */}
          <div style={styles.buttonGroup}>
            <button
              onClick={() => router.push("/scan")}
              style={styles.scanBtn}
            >
              <QrCode size={20} />
              <span style={{ marginLeft: 8 }}>Buka Scan QR Code</span>
            </button>
            
            <button
              onClick={() => router.back()}
              style={styles.backBtnSecondary}
            >
              <ArrowLeft size={20} />
              <span style={{ marginLeft: 8 }}>Kembali</span>
            </button>
          </div>

          {/* Footer Note */}
          <div style={styles.footerNote}>
            <p style={styles.noteText}>
              💡 <strong>Tips:</strong> Pastikan Anda scan QR code yang benar untuk area yang akan di-inspeksi
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    padding: "20px",
    position: "relative" as const,
  },
  overlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.1)",
  },
  content: {
    position: "relative" as const,
    width: "100%",
    maxWidth: "600px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: 0,
    flex: 1,
    textAlign: "center" as const,
  },
  backBtn: {
    background: "rgba(255, 255, 255, 0.9)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2c3e50",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
    animation: "slideUp 0.5s ease-out",
  },
  iconContainer: {
    textAlign: "center" as const,
    marginBottom: "24px",
    animation: "bounce 2s infinite",
  },
  alertBox: {
    display: "flex",
    alignItems: "flex-start",
    background: "#ffe0e0",
    border: "2px solid #ff6b6b",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
    color: "#c92a2a",
  },
  alertTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  alertText: {
    fontSize: "14px",
    lineHeight: "1.5",
  },
  infoBox: {
    background: "#f0f4f8",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "24px",
    border: "1px solid #d4dce6",
  },
  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  infoLabel: {
    fontSize: "14px",
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
  },
  messageBox: {
    background: "#f9f9f9",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "24px",
  },
  message: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    color: "#2c3e50",
  },
  messageSmall: {
    margin: "0 0 12px 0",
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.5",
  },
  list: {
    margin: "0",
    paddingLeft: "20px",
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.8",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    marginBottom: "16px",
  },
  scanBtn: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "14px 24px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  },
  backBtnSecondary: {
    background: "white",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  },
  footerNote: {
    textAlign: "center" as const,
    background: "#e8f4f8",
    borderRadius: "8px",
    padding: "12px",
    borderLeft: "4px solid #0ea5e9",
  },
  noteText: {
    margin: 0,
    fontSize: "13px",
    color: "#0d6b7a",
    lineHeight: "1.5",
  },
};
