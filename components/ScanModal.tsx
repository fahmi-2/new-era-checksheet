// components/ScanModal.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScanModal({ isOpen, onClose }: ScanModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);

  // ✅ Cleanup camera & scanner
  const forceStopCamera = useCallback(async () => {
    if (isProcessingRef.current) return; // Cegah double cleanup
    isProcessingRef.current = true;

    try {
      // Stop MediaStream
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }

      // Stop html5-qrcode
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (err) {
          console.debug("Error stopping scanner:", err);
        }
        html5QrCodeRef.current = null;
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // ✅ Inisialisasi scanner ketika modal dibuka
  useEffect(() => {
    if (!isOpen) {
      forceStopCamera();
      return;
    }

    const initScanner = async () => {
      if (!scannerRef.current) return;
      setError(null);
      isProcessingRef.current = false;

      try {
        // Ambil stream kamera secara manual
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        activeStreamRef.current = stream;

        const html5QrCode = new Html5Qrcode("qr-reader-modal");
        html5QrCodeRef.current = html5QrCode;

        // Gunakan deviceId dari stream yang sudah kita ambil
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack?.getSettings();
        const deviceId = settings?.deviceId;

        // Start scanner dengan deviceId
        html5QrCode.start(
          { deviceId: { exact: deviceId } },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => handleScanResult(decodedText.trim()),
          (err) => console.debug("QR decode error:", err)
        );
      } catch (err) {
        console.error("Gagal akses kamera:", err);
        setError("Tidak dapat mengakses kamera. Pastikan browser memiliki akses ke kamera.");
      }
    };

    initScanner();

    return () => {
      forceStopCamera();
    };
  }, [isOpen, forceStopCamera]);

  // ✅ Handle scan result dengan proper routing
  const handleScanResult = useCallback(
    async (text: string) => {
      if (isProcessingRef.current) return; // Cegah double processing
      isProcessingRef.current = true;
      setIsProcessing(true);

      // 🔥 MATIKAN KAMERA & TUNGGU SAMPAI BENAR-BENAR MATI
      await forceStopCamera();

      try {
        if (!text.startsWith("echecksheet://")) {
          setError("QR tidak valid. Harus dimulai dengan: echecksheet://");
          isProcessingRef.current = false;
          setIsProcessing(false);
          return;
        }

        const remaining = text.replace(/^echecksheet:\/\//, "");
        const parts = remaining.split("/");

        if (parts.length < 2) {
          setError("Format QR tidak lengkap.\nContoh: echecksheet://fire-alarm/zona-1?action=form");
          isProcessingRef.current = false;
          setIsProcessing(false);
          return;
        }

        const type = parts[0];
        const rest = parts.slice(1).join("/");
        const [id, query] = rest.split("?");

        if (!type || !id) {
          setError("Jenis atau ID tidak ditemukan.");
          isProcessingRef.current = false;
          setIsProcessing(false);
          return;
        }

        const queryParams = new URLSearchParams(query || "");
        const action = queryParams.get("action") || "form";

        let targetUrl = "";

        // ✅ MAPPING SEMUA TIPE CHECKSHEET
        switch (type) {
          case "fire-alarm":
            targetUrl = action === "history"
              ? `/status-ga/fire-alarm/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/fire-alarm/${encodeURIComponent(id)}`;
            break;

          case "apar":
            targetUrl = action === "history"
              ? `/status-ga/inspeksi-apar/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/inspeksi-apar/${encodeURIComponent(id)}`;
            break;

          case "toilet":
            targetUrl = action === "history"
              ? `/status-ga/checksheet-toilet/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/checksheet-toilet/${encodeURIComponent(id)}`;
            break;

          case "lift-barang":
            targetUrl = action === "history"
              ? `/status-ga/inspeksi-preventif-lift-barang/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/inspeksi-preventif-lift-barang/${encodeURIComponent(id)}`;
            break;

          case "hydrant":
            // ID bisa berupa lokasi atau "no-X"
            const hydrantId = id.replace("no-", "");
            targetUrl = action === "history"
              ? `/status-ga/inspeksi-hydrant/riwayat/${encodeURIComponent(hydrantId)}`
              : `/status-ga/inspeksi-hydrant/${encodeURIComponent(hydrantId)}`;
            break;

          case "smoke-detector":
            targetUrl = action === "history"
              ? `/status-ga/smoke-detector/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/smoke-detector/${encodeURIComponent(id)}`;
            break;

          case "selang-hydrant":
            targetUrl = action === "history"
              ? `/status-ga/selang-hydrant/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/selang-hydrant/${encodeURIComponent(id)}`;
            break;

          case "emergency":
            targetUrl = action === "history"
              ? `/status-ga/inspeksi-emergency/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/inspeksi-emergency/${encodeURIComponent(id)}`;
            break;

          case "exit-lamp":
            targetUrl = action === "history"
              ? `/status-ga/exit-lamp-pintu-darurat/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/exit-lamp-pintu-darurat/${encodeURIComponent(id)}`;
            break;

          case "panel":
            targetUrl = action === "history"
              ? `/status-ga/panel/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/panel/${encodeURIComponent(id)}`;
            break;

          case "stop-kontak":
            targetUrl = action === "history"
              ? `/status-ga/form-inspeksi-stop-kontak/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/form-inspeksi-stop-kontak/${encodeURIComponent(id)}`;
            break;

          case "inf-jalan":
            targetUrl = action === "history"
              ? `/status-ga/ga-inf-jalan/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/ga-inf-jalan/${encodeURIComponent(id)}`;
            break;

          case "apd":
            targetUrl = action === "history"
              ? `/status-ga/inspeksi-apd/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/inspeksi-apd/${encodeURIComponent(id)}`;
            break;

          case "tg-listrik":
            targetUrl = action === "history"
              ? `/status-ga/tg-listrik/riwayat/${encodeURIComponent(id)}`
              : `/status-ga/tg-listrik/${encodeURIComponent(id)}`;
            break;

          default:
            setError(`Jenis checksheet "${type}" tidak dikenali.`);
            isProcessingRef.current = false;
            setIsProcessing(false);
            return;
        }

        if (action === "form") {
          const today = new Date().toISOString().split("T")[0];
          targetUrl += `?date=${today}`;
        }

        // ✅ Tutup modal terlebih dahulu
        onClose();

        // ✅ Tunggu sedikit sebelum navigasi untuk memastikan cleanup
        await new Promise((resolve) => setTimeout(resolve, 300));

        // ✅ Sekarang aman untuk navigasi
        router.push(targetUrl);
      } catch (err) {
        console.error("Error memproses QR:", err);
        setError("Terjadi kesalahan saat memproses QR code.");
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [onClose, router, forceStopCamera]
  );

  const handleClose = async () => {
    await forceStopCamera();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="scan-modal-overlay" onClick={handleClose}>
      <div className="scan-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="scan-modal-header">
          <div className="scan-modal-title">
            <AlertTriangle size={24} />
            Scan QR Checksheet
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="scan-modal-close"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="scan-modal-body">
          {error ? (
            <div className="scan-error-box">
              <p>{error}</p>
              <button onClick={handleClose} className="btn-error-close">
                Tutup
              </button>
            </div>
          ) : (
            <>
              <div id="qr-reader-modal" ref={scannerRef} className="qr-scanner-modal" />
              <p className="scan-instruction">Arahkan kamera ke QR code</p>
              {isProcessing && <p className="scan-processing">Memproses...</p>}
            </>
          )}
        </div>

        <style jsx>{`
          .scan-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            animation: fadeIn 0.2s ease-in;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .scan-modal-content {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            max-width: 500px;
            width: 100%;
            overflow: hidden;
            animation: slideUp 0.3s ease-out;
          }

          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .scan-modal-header {
            background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
            color: white;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }

          .scan-modal-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.3rem;
            font-weight: 700;
            margin: 0;
          }

          .scan-modal-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            cursor: pointer;
            padding: 6px 8px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            flex-shrink: 0;
          }

          .scan-modal-close:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
          }

          .scan-modal-close:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .scan-modal-body {
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .qr-scanner-modal {
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
          }

          .scan-instruction {
            color: #475569;
            font-size: 0.95rem;
            text-align: center;
            margin: 0;
          }

          .scan-processing {
            color: #1976d2;
            font-size: 0.9rem;
            text-align: center;
            margin: 0;
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%,
            100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }

          .scan-error-box {
            text-align: center;
            padding: 20px;
            background: #fee;
            border-radius: 12px;
            border: 1px solid #fcc;
            color: #c62828;
          }

          .scan-error-box p {
            margin: 0 0 12px 0;
            font-size: 0.95rem;
            line-height: 1.5;
            white-space: pre-line;
          }

          .btn-error-close {
            padding: 8px 16px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            transition: background 0.2s ease;
          }

          .btn-error-close:hover {
            background: #b91c1c;
          }

          @media (max-width: 600px) {
            .scan-modal-overlay {
              padding: 0;
            }

            .scan-modal-content {
              border-radius: 12px;
              max-height: 90vh;
            }

            .scan-modal-header {
              padding: 16px;
            }

            .scan-modal-title {
              font-size: 1.1rem;
            }

            .scan-modal-body {
              padding: 16px;
            }

            #qr-reader-modal {
              max-width: 250px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
