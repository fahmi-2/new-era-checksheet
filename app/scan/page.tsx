// app/scan/page.tsx
// ─────────────────────────────────────────────────────────────
// PRODUCTION-READY: HTTP-safe QR Scanner
// Fixes untuk Android:
//   [A] Resize gambar kamera ke MAX_DECODE_SIZE sebelum decode
//       → mengatasi foto 12MP yang membuat jsQR OOM/timeout
//   [B] Decode langsung pada resolusi yang sudah di-resize
//       → tidak perlu 4 rotasi lagi (Android Chrome ≥81 sudah auto-EXIF)
//   [C] Fallback rotasi tetap ada tapi HANYA diperlukan jika decode gagal
//   [D] isProcessingRef direset di SETIAP jalur exit error
//   [E] Hapus crossOrigin pada objectURL → fix Samsung Internet CORS error
//   [F] buildTargetUrl: strip leading slash → fix QR triple-slash
//   [G] URL tanpa hardcode basePath → Next.js router.push() sudah handle
// ─────────────────────────────────────────────────────────────
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import {
  X, RefreshCw, CheckCircle, Loader2, ScanLine, Camera as CameraIcon,
} from "lucide-react";
import jsQR from "jsqr";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

/**
 * Batas dimensi maksimum sebelum decode.
 *
 * Foto kamera Android biasanya 3024×4032 (12MP) = 48 juta pixel.
 * jsQR akan mengiterasi setiap pixel → terlalu lambat & bisa OOM.
 *
 * MAX_DECODE_SIZE = 1280:
 *   Foto 3024×4032 → di-resize ke 960×1280 (1.2MP)
 *   Reduksi 97% ukuran data, QR masih 100% terbaca karena
 *   module QR berukuran minimal ~25px di resolusi ini.
 *
 * Jangan set terlalu rendah (< 800) — QR bisa jadi terlalu kecil untuk jsQR.
 * Jangan set terlalu tinggi (> 2000) — tidak ada manfaat performa.
 */
const MAX_DECODE_SIZE = 1280;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type ScanStatus = "idle" | "scanning" | "success";

// ─────────────────────────────────────────────────────────────
// ROLE HELPER
// ─────────────────────────────────────────────────────────────
function hasQRScanAccess(role: string | undefined): boolean {
  if (!role) return false;
  if (
    role.startsWith("inspector-ga") ||
    role.startsWith("group-leader") ||
    role.startsWith("inspector-qa")
  ) return true;
  return ["supervisor", "manager-ga", "admin-ga", "super-admin", "admin", "superadmin"].includes(role);
}

// ─────────────────────────────────────────────────────────────
// [A] RESIZE + DECODE — solusi utama untuk Android
// ─────────────────────────────────────────────────────────────

/**
 * resizeImageToCanvas
 *
 * Resize HTMLImageElement ke dalam canvas dengan dimensi ≤ MAX_DECODE_SIZE.
 * Jika gambar lebih kecil dari MAX_DECODE_SIZE, tidak di-resize.
 *
 * CATATAN PENTING — EXIF Orientation di Android:
 *   Chrome Android ≥ 81 otomatis menerapkan EXIF orientation ke gambar.
 *   Artinya img.naturalWidth/naturalHeight SUDAH mencerminkan orientasi final.
 *   Kita TIDAK perlu mendeteksi atau mengoreksi EXIF secara manual.
 *
 *   Samsung Internet (Blink engine): perilaku sama dengan Chrome Android.
 *   Safari iOS: EXIF tidak selalu diaplikasikan → fallback rotasi tetap ada.
 *
 * @param img - Image yang sudah di-load
 * @param canvas - Canvas yang akan digunakan
 * @param maxSize - Dimensi maksimum (default: MAX_DECODE_SIZE)
 * @returns { w: number, h: number } dimensi canvas yang digunakan
 */
function resizeImageToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  maxSize: number = MAX_DECODE_SIZE
): { w: number; h: number } {
  const srcW = img.naturalWidth  || img.width;
  const srcH = img.naturalHeight || img.height;

  // Hitung skala agar sisi terpanjang ≤ maxSize
  const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
  const dstW  = Math.round(srcW * scale);
  const dstH  = Math.round(srcH * scale);

  canvas.width  = dstW;
  canvas.height = dstH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return { w: dstW, h: dstH };

  // imageSmoothingQuality: "high" untuk kualitas terbaik saat downscale
  ctx.imageSmoothingEnabled  = true;
  ctx.imageSmoothingQuality  = "high";
  ctx.drawImage(img, 0, 0, dstW, dstH);

  return { w: dstW, h: dstH };
}

/**
 * decodeQRFromCanvas
 *
 * Decode QR dari canvas yang sudah berisi gambar.
 * Dipanggil SETELAH resizeImageToCanvas.
 *
 * Rotasi hanya dilakukan sebagai fallback untuk device yang tidak
 * menerapkan EXIF orientation (Safari iOS lama, beberapa Samsung Internet).
 *
 * Rotasi dilakukan pada dimensi yang SUDAH kecil (≤ MAX_DECODE_SIZE)
 * sehingga tidak membebani memori.
 */
function decodeQRFromCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement
): string | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const srcW = img.naturalWidth  || img.width;
  const srcH = img.naturalHeight || img.height;
  const scale = Math.min(1, MAX_DECODE_SIZE / Math.max(srcW, srcH));
  const dstW  = Math.round(srcW * scale);
  const dstH  = Math.round(srcH * scale);

  // ── Attempt 0: Orientasi normal (sudah di-resize oleh resizeImageToCanvas) ──
  // Canvas sudah berisi gambar dari resizeImageToCanvas, coba decode langsung
  {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    if (code?.data) {
      console.log("✅ [QR] Decoded at 0° (normal)");
      return code.data;
    }
    console.log(`⚠️ [QR] 0° failed — size: ${canvas.width}×${canvas.height}`);
  }

  // ── Attempts 1-3: Fallback rotasi (untuk Safari iOS / Samsung lama) ──
  // Rotasi dilakukan pada ukuran yang sudah kecil, sehingga tidak OOM
  const rotations = [90, 180, 270] as const;

  for (const angle of rotations) {
    // Swap width/height untuk 90° dan 270°
    const rotW = angle === 180 ? dstW : dstH;
    const rotH = angle === 180 ? dstH : dstW;

    canvas.width  = rotW;
    canvas.height = rotH;

    ctx.save();
    ctx.translate(rotW / 2, rotH / 2);
    ctx.rotate((angle * Math.PI) / 180);

    // Gambar original di-draw ulang dengan skala
    // Offset: -dstW/2 dan -dstH/2 karena kita rotate di tengah
    if (angle === 90 || angle === 270) {
      ctx.drawImage(img, 0, 0, srcW, srcH, -dstH / 2, -dstW / 2, dstH, dstW);
    } else {
      ctx.drawImage(img, 0, 0, srcW, srcH, -dstW / 2, -dstH / 2, dstW, dstH);
    }
    ctx.restore();

    const imageData = ctx.getImageData(0, 0, rotW, rotH);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code?.data) {
      console.log(`✅ [QR] Decoded at ${angle}° (fallback rotation)`);
      return code.data;
    }
    console.log(`⚠️ [QR] ${angle}° failed`);
  }

  console.log("❌ [QR] All orientations failed");
  return null;
}

// ─────────────────────────────────────────────────────────────
// URL HELPERS
// ─────────────────────────────────────────────────────────────
function addScanParam(url: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}_scanned=true`;
}

/**
 * buildTargetUrl
 *
 * Parse QR data menjadi path Next.js.
 *
 * FIX [F]: Normalize trailing slash dari QR format echecksheet:///
 *   QR bisa berisi: echecksheet://  (2 slash) ATAU echecksheet:///  (3 slash)
 *   → strip semua leading slash setelah "echecksheet://"
 *
 * FIX [G]: TIDAK menyertakan basePath (/e-checksheet-ga) dalam URL.
 *   next/navigation router.push() otomatis menambahkan basePath
 *   dari next.config.mjs. Hardcode basePath → double prefix → 404.
 *
 * @returns path relatif (tanpa basePath), atau null jika tidak dikenali
 */
function buildTargetUrl(result: string): string | null {
  const text = result.trim();
  if (!text.startsWith("echecksheet://")) return null;

  // FIX [F]: Strip "echecksheet://" + semua leading slash
  const remaining = text
    .replace(/^echecksheet:\/\//, "")
    .replace(/^\/+/, "");

  console.log(`[buildTargetUrl] remaining: "${remaining}"`);

  // ── FORMAT: status-ga/[type]/[params] ──
  if (remaining.startsWith("status-ga/")) {
    const rest = remaining.replace("status-ga/", "");
    const [firstPart, ...restParts] = rest.split("/");
    const urlWithQuery = [firstPart, ...restParts].join("/");
    const [pathPart, query] = urlWithQuery.split("?");
    const p = new URLSearchParams(query || "");

    console.log(`[buildTargetUrl] status-ga type: "${firstPart}"`);

    // FIX [G]: Semua URL TANPA /e-checksheet-ga prefix
    const routeMap: Record<string, () => string> = {
      "fire-alarm": () =>
        `/status-ga/fire-alarm/${encodeURIComponent(pathPart.replace("fire-alarm/", ""))}`,

      "inspeksi-hydrant": () => {
        const v = p.get("openHydrant");
        return v ? `/status-ga/inspeksi-hydrant?openHydrant=${encodeURIComponent(v)}` : "";
      },

      "inspeksi-apar": () =>
        `/status-ga/inspeksi-apar/${encodeURIComponent(pathPart.replace("inspeksi-apar/", ""))}`,

      "checksheet-toilet": () =>
        `/status-ga/checksheet-toilet/${encodeURIComponent(pathPart.replace("checksheet-toilet/", ""))}`,

      "lift-barang": () => {
        const v = p.get("openLift");
        return v ? `/status-ga/lift-barang?openLift=${encodeURIComponent(v)}` : "";
      },

      "selang-hydrant": () => {
        const v = p.get("openArea");
        return v ? `/status-ga/selang-hydrant?openArea=${encodeURIComponent(v)}` : "";
      },

      "smoke-detector": () => {
        const v = p.get("openArea");
        return v ? `/status-ga/smoke-detector?openArea=${encodeURIComponent(v)}` : "";
      },

      "inspeksi-emergency": () =>
        `/status-ga/inspeksi-emergency/${encodeURIComponent(pathPart.replace("inspeksi-emergency/", ""))}`,

      "exit-lamp-pintu-darurat": () =>
        `/status-ga/exit-lamp-pintu-darurat/${encodeURIComponent(pathPart.replace("exit-lamp-pintu-darurat/", ""))}`,

      "panel": () => {
        const v = p.get("openPanel");
        return v ? `/status-ga/panel?openPanel=${encodeURIComponent(v)}` : "";
      },

      "form-inspeksi-stop-kontak": () =>
        `/status-ga/form-inspeksi-stop-kontak/${encodeURIComponent(pathPart.replace("form-inspeksi-stop-kontak/", ""))}`,

      "ga-inf-jalan": () => {
        const v = p.get("search");
        return v ? `/status-ga/ga-inf-jalan?search=${encodeURIComponent(v)}` : "";
      },

      "inspeksi-apd": () => {
        const v = p.get("areaId");
        return v ? `/status-ga/inspeksi-apd?areaId=${encodeURIComponent(v)}` : "";
      },

      "tg-listrik": () => {
        const v = p.get("openArea");
        return v ? `/status-ga/tg-listrik?openArea=${encodeURIComponent(v)}` : "";
      },

      "inspeksi-preventif-lift-barang": () =>
        `/status-ga/inspeksi-preventif-lift-barang/${encodeURIComponent(pathPart.replace("inspeksi-preventif-lift-barang/", ""))}`,
    };

    const builder = routeMap[firstPart];
    if (!builder) {
      console.log(`[buildTargetUrl] ❌ Unrecognized status-ga type: "${firstPart}"`);
      return null;
    }
    const url = builder();
    if (!url) {
      console.log(`[buildTargetUrl] ❌ Builder returned empty for: "${firstPart}"`);
      return null;
    }
    return addScanParam(url);
  }

  // ── FORMAT: e-checksheet-*/... ──
  if (remaining.startsWith("e-checksheet-")) {
    const [pathPart, query] = remaining.split("?", 2);
    const [checksheetType] = pathPart.split("/");
    const params = new URLSearchParams(query || "");
    let targetUrl = "";

    console.log(`[buildTargetUrl] e-checksheet type: "${checksheetType}"`);

    const buildUrl = (base: string, primary: string, secondary: Record<string, string>) => {
      const pVal = params.get(primary) || params.get(primary.replace("open", ""));
      if (!pVal) {
        console.log(`[buildTargetUrl] ❌ Primary param "${primary}" not found`);
        return;
      }
      const allPresent = Object.values(secondary).every((v) => params.get(v) !== null);
      if (allPresent) {
        const queryParams = Object.entries(secondary)
          .map(([k, v]) => `${k}=${encodeURIComponent(params.get(v) || "")}`)
          .join("&");
        targetUrl = `${base}?${queryParams}`;
      } else {
        const key = primary.replace("open", "");
        targetUrl = `${base}?${key}=${encodeURIComponent(pVal)}`;
      }
    };

    // FIX [G]: Semua base URL TANPA /e-checksheet-ga prefix
    switch (checksheetType) {
      case "e-checksheet-hydrant":
        buildUrl("/e-checksheet-hydrant", "openHydrant", { no: "no", lokasi: "lokasi", zona: "zona", jenis: "jenisHydrant" });
        break;
      case "e-checksheet-inf-jalan":
        buildUrl("/e-checksheet-inf-jalan", "search", { areaName: "areaName", kategori: "kategori", lokasi: "lokasi" });
        break;
      case "e-checksheet-ins-apd":
        buildUrl("/e-checksheet-ins-apd", "areaId", { areaName: "areaName", areaType: "areaType" });
        break;
      case "e-checksheet-lift-barang":
        buildUrl("/e-checksheet-lift-barang", "openLift", { liftName: "liftName", area: "area", lokasi: "lokasi" });
        break;
      case "e-checksheet-panel":
        buildUrl("/e-checksheet-panel", "openPanel", { panelName: "panelName", area: "area", date: "date" });
        break;
      case "e-checksheet-slg-hydrant":
        buildUrl("/e-checksheet-slg-hydrant", "openArea", { lokasi: "lokasi", zona: "zona", jenis: "jenisHydrant", pic: "pic" });
        break;
      case "e-checksheet-smoke-detector":
        buildUrl("/e-checksheet-smoke-detector", "openArea", { no: "no", lokasi: "lokasi", zona: "zona" });
        break;
      case "e-checksheet-tg-listrik":
        buildUrl("/e-checksheet-tg-listrik", "openArea", { areaName: "areaName", lokasi: "lokasi" });
        break;
      default:
        console.log(`[buildTargetUrl] ❌ Unrecognized checksheet type: "${checksheetType}"`);
        return null;
    }

    if (!targetUrl) return null;
    return addScanParam(targetUrl);
  }

  // ── FORMAT LEGACY ──
  const parts = remaining.split("/");
  if (parts.length < 2) {
    console.log(`[buildTargetUrl] ❌ Legacy format too short: "${remaining}"`);
    return null;
  }
  const [type, ...restParts] = parts;
  const [id] = restParts.join("/").split("?");
  if (!type || !id) {
    console.log(`[buildTargetUrl] ❌ Legacy: type="${type}" id="${id}"`);
    return null;
  }

  console.log(`[buildTargetUrl] Legacy type: "${type}", id: "${id}"`);

  // FIX [G]: TANPA /e-checksheet-ga prefix
  const legacyMap: Record<string, string> = {
    "fire-alarm":  `/status-ga/fire-alarm/${encodeURIComponent(id)}`,
    "apar":        `/status-ga/inspeksi-apar/${encodeURIComponent(id)}`,
    "toilet":      `/status-ga/checksheet-toilet/${encodeURIComponent(id)}`,
    "lift-barang": `/status-ga/inspeksi-preventif-lift-barang/${encodeURIComponent(id)}`,
    "hydrant":     `/status-ga/inspeksi-hydrant?openHydrant=${encodeURIComponent(id)}`,
  };

  const url = legacyMap[type];
  if (!url) {
    console.log(`[buildTargetUrl] ❌ Unknown legacy type: "${type}"`);
    return null;
  }
  return addScanParam(url);
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function ScanPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");

  const fileInputRef     = useRef<HTMLInputElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const isProcessingRef  = useRef(false);
  const isMountedRef     = useRef(true);
  const autoTriggeredRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Safe setters ──
  const safeSetError      = useCallback((m: string | null) => { if (isMountedRef.current) setError(m);      }, []);
  const safeSetSuccess    = useCallback((m: string | null) => { if (isMountedRef.current) setSuccess(m);    }, []);
  const safeSetScanStatus = useCallback((s: ScanStatus)    => { if (isMountedRef.current) setScanStatus(s); }, []);

  // ── Trigger camera ──
  const triggerNativeCamera = useCallback(() => {
    if (isProcessingRef.current) return;
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    requestAnimationFrame(() => { input.click(); });
  }, []);

  // ── FIX [D]: Parse & Navigate — reset isProcessingRef di SETIAP jalur error ──
  const parseAndNavigate = useCallback(
    async (qrData: string) => {
      safeSetScanStatus("scanning");

      try {
        if (!qrData.trim().startsWith("echecksheet://")) {
          console.log(`[parseAndNavigate] ❌ Invalid prefix: "${qrData.slice(0, 30)}"`);
          safeSetError("❌ QR tidak valid.\nHarus dimulai dengan: echecksheet://");
          safeSetScanStatus("idle");
          isProcessingRef.current = false; // FIX [D]
          setTimeout(() => safeSetError(null), 5000);
          return;
        }

        const targetUrl = buildTargetUrl(qrData);
        console.log(`[parseAndNavigate] targetUrl: ${targetUrl}`);

        if (!targetUrl) {
          safeSetError("⚠️ Jenis checksheet pada QR ini tidak dikenali.\nPastikan QR dari aplikasi E-Checksheet-GA.");
          safeSetScanStatus("idle");
          isProcessingRef.current = false; // FIX [D]
          setTimeout(() => safeSetError(null), 5000);
          return;
        }

        console.log("✅ [parseAndNavigate] Navigating to:", targetUrl);
        safeSetSuccess("✅ QR berhasil diproses! Mengalihkan...");
        safeSetScanStatus("success");
        setTimeout(() => {
          if (isMountedRef.current) {
            console.log("🚀 [parseAndNavigate] router.push:", targetUrl);
            router.push(targetUrl);
          }
        }, 500);

      } catch (err) {
        console.error("❌ [parseAndNavigate] Error:", err);
        safeSetError("⚠️ Terjadi kesalahan saat memproses QR code.");
        safeSetScanStatus("idle");
        isProcessingRef.current = false; // FIX [D]
        setTimeout(() => safeSetError(null), 5000);
      }
    },
    [router, safeSetError, safeSetSuccess, safeSetScanStatus]
  );

  // ── [A][B][C][E] Handle image capture — Android-safe ──
  const handleImageCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];

      // Reset segera — SEBELUM cek file
      // Penting: e.target mungkin tidak valid setelah async
      e.target.value = "";

      if (!file) {
        console.log("ℹ️ [capture] User cancelled / no file");
        return;
      }

      if (isProcessingRef.current) {
        console.log("⚠️ [capture] Already processing, skip");
        return;
      }

      isProcessingRef.current = true;
      if (isMountedRef.current) {
        setScanStatus("scanning");
        setError(null);
        setSuccess(null);
      }

      // [D] Log untuk debugging — PENTING untuk mendiagnosis Android
      console.log("─────────────────────────────────");
      console.log("📸 [capture] File info:");
      console.log(`   name: ${file.name}`);
      console.log(`   type: ${file.type}`);
      console.log(`   size: ${(file.size / 1024).toFixed(0)} KB`);
      console.log(`   lastModified: ${new Date(file.lastModified).toISOString()}`);

      let objectUrl: string | null = null;

      try {
        objectUrl = URL.createObjectURL(file);
        console.log("✅ [capture] objectURL created");

        // FIX [E]: TIDAK set crossOrigin untuk objectURL
        // crossOrigin pada objectURL menyebabkan CORS error di Samsung Internet
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          // ❌ JANGAN: image.crossOrigin = "anonymous"
          image.onload = () => {
            console.log(`✅ [capture] Image loaded: ${image.naturalWidth}×${image.naturalHeight}px`);
            console.log(`   display size: ${image.width}×${image.height}px`);
            resolve(image);
          };
          image.onerror = (ev) => {
            console.error("❌ [capture] Image load error:", ev);
            reject(new Error("Gagal memuat gambar dari kamera"));
          };
          image.src = objectUrl!;
        });

        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Canvas ref tidak tersedia");

        // FIX [A]: Resize ke MAX_DECODE_SIZE sebelum decode
        console.log(`🔧 [capture] Resizing to max ${MAX_DECODE_SIZE}px...`);
        const { w: resizedW, h: resizedH } = resizeImageToCanvas(img, canvas);
        console.log(`✅ [capture] Resized to: ${resizedW}×${resizedH}px`);

        // FIX [B]: Decode dari gambar yang sudah di-resize
        console.log("🔍 [capture] Starting QR decode...");
        const qrData = decodeQRFromCanvas(img, canvas);

        if (qrData) {
          console.log(`✅ [capture] QR Data: "${qrData.slice(0, 100)}${qrData.length > 100 ? "..." : ""}"`);
          await parseAndNavigate(qrData);
        } else {
          console.log("❌ [capture] QR not detected after all attempts");
          safeSetError(
            "❌ QR code tidak terdeteksi.\n\n💡 Tips:\n• Pastikan QR jelas & tidak blur\n• Pencahayaan cukup\n• Arahkan kamera tegak lurus ke QR\n• Jarak ideal: 15–30cm\n• Hindari pantulan cahaya"
          );
          safeSetScanStatus("idle");
          isProcessingRef.current = false; // FIX [D]
          setTimeout(() => safeSetError(null), 7000);
        }

      } catch (err) {
        console.error("❌ [capture] Error:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        safeSetError(`⚠️ Gagal memproses gambar.\n${errMsg}\nSilakan coba lagi.`);
        safeSetScanStatus("idle");
        isProcessingRef.current = false; // FIX [D]
        setTimeout(() => safeSetError(null), 5000);

      } finally {
        // Revoke objectURL SETELAH image processing selesai
        // (img sudah di-draw ke canvas, objectURL tidak dibutuhkan lagi)
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          console.log("✅ [capture] objectURL revoked");
        }
        console.log("─────────────────────────────────");
        // CATATAN: isProcessingRef TIDAK direset di sini untuk kasus success
        // karena redirect sedang dalam setTimeout 500ms.
        // isProcessingRef untuk kasus error sudah direset di masing-masing branch di atas.
      }
    },
    [parseAndNavigate, safeSetError, safeSetScanStatus]
  );

  // ── Retry ──
  const handleRetry = useCallback(() => {
    isProcessingRef.current = false;
    setError(null);
    setSuccess(null);
    setScanStatus("idle");
    setTimeout(() => triggerNativeCamera(), 150);
  }, [triggerNativeCamera]);

  const handleCancel = useCallback(() => router.back(), [router]);

  // ── Auth guard ──
  useEffect(() => {
    if (authLoading) return;
    if (!user)                       { router.replace("/login-page"); return; }
    if (!hasQRScanAccess(user.role)) { router.replace("/home");       return; }
  }, [authLoading, user, router]);

  // ── Auto-trigger camera on mount ──
  // NOTE: Browser memblokir input.click() tanpa user gesture (Chrome policy).
  // Auto-trigger ini best-effort — tombol manual tetap diperlukan.
  useEffect(() => {
    if (authLoading || !user || !hasQRScanAccess(user.role)) return;
    if (autoTriggeredRef.current) return;
    autoTriggeredRef.current = true;
    const timer = setTimeout(() => triggerNativeCamera(), 300);
    return () => clearTimeout(timer);
  }, [authLoading, user, triggerNativeCamera]);

  const isProcessing = scanStatus === "scanning";

  // ── Early returns ──
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} color="#1976d2" />
          <p className="text-gray-600">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }
  if (!user || !hasQRScanAccess(user.role)) return null;

  // ── Render ──
  return (
    <div className="app-page">
      <Sidebar userName={user?.fullName || "User"} />

      {/* Canvas untuk decode QR — harus di DOM, display:none aman */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/*
        INPUT KAMERA — HTTP compatible, tidak perlu HTTPS
        ─────────────────────────────────────────────────
        accept="image/*"          → semua format gambar
        capture="environment"     → hint kamera belakang (Android)
        
        Perilaku per platform:
        • Android Chrome ≥ 72     → buka kamera langsung ✅
        • Samsung Internet ≥ 10   → buka kamera langsung ✅  
        • Safari iOS              → action sheet (kamera/galeri) ✅
        • Desktop Chrome/Firefox  → file picker biasa ✅
        
        Android menghasilkan JPEG ~2-8MB.
        Safari iOS menghasilkan JPEG atau HEIC (dikonversi browser).
        Semua dihandle oleh resizeImageToCanvas sebelum decode.
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageCapture}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="page-content">
        <div className="header-banner">
          <div className="header-title">
            <ScanLine size={28} color="#ffffff" />
            Scan QR Checksheet
          </div>
          <p className="header-subtitle">📱 Kamera native · Bekerja di HTTP &amp; HTTPS</p>
        </div>

        <div className="scan-container">

          {/* ✅ Success */}
          {success && (
            <div className="status-box success-box">
              <CheckCircle size={48} color="#22c55e" />
              <p className="status-title">{success}</p>
              <button onClick={handleRetry} className="btn btn-primary">
                <RefreshCw size={16} /> Scan Lagi
              </button>
            </div>
          )}

          {/* ❌ Error */}
          {error && !success && (
            <div className="status-box error-box">
              <p className="status-title error-title" style={{ whiteSpace: "pre-line" }}>
                {error}
              </p>
              <div className="btn-row">
                <button onClick={handleRetry} className="btn btn-primary">
                  <RefreshCw size={16} /> Scan Ulang
                </button>
                <button onClick={handleCancel} className="btn btn-danger">
                  <X size={16} /> Kembali
                </button>
              </div>
            </div>
          )}

          {/* 🔄 Processing */}
          {isProcessing && !success && !error && (
            <div className="status-box processing-box">
              <Loader2
                className="animate-spin"
                size={48}
                color="#1976d2"
                style={{ display: "block", margin: "0 auto" }}
              />
              <p className="status-title processing-title">Memproses QR Code...</p>
              <p className="status-hint">Menganalisis gambar, mohon tunggu</p>
            </div>
          )}

          {/* 📷 Idle */}
          {!success && !error && !isProcessing && (
            <div className="status-box camera-box">
              <div className="camera-icon-wrap">
                <CameraIcon size={56} color="#1976d2" />
              </div>
              <p className="status-title prompt-title">📸 Siapkan Kamera</p>
              <p className="status-hint prompt-hint">
                Arahkan ke QR code dan ambil foto.<br />
                Sistem akan otomatis memproses.
              </p>
              <button
                onClick={triggerNativeCamera}
                className="btn btn-scan"
                disabled={isProcessing}
              >
                <CameraIcon size={18} />
                Ambil Foto QR
              </button>
              <p className="tips-text">
                💡 QR jelas · Pencahayaan cukup · Jarak 15–30cm · Tegak lurus
              </p>
            </div>
          )}

          {/* 🔙 Cancel */}
          {!success && (
            <div className="btn-row">
              <button
                onClick={handleCancel}
                className="btn btn-danger"
                disabled={isProcessing}
              >
                <X size={18} /> Kembali
              </button>
            </div>
          )}

        </div>

        <div className="info-box">
          <p className="info-title">✅ Kompatibel HTTP &amp; HTTPS</p>
          <p className="info-desc">
            Kamera native · Tidak memerlukan HTTPS<br />
            Android Chrome · Samsung Internet · Safari iOS · Desktop
          </p>
        </div>
      </div>

      <style jsx>{`
        .app-page { display: flex; min-height: 100vh; background-color: #f7f9fc; }
        .page-content { flex: 1; padding: 24px; max-width: 1400px; margin: 0 auto; }
        .hidden { display: none !important; }

        .header-banner {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white; padding: 24px 32px; border-radius: 16px;
          margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .header-title {
          font-size: 1.8rem; font-weight: 700; margin: 0;
          display: flex; align-items: center; gap: 12px;
        }
        .header-subtitle { margin: 8px 0 0; font-size: 0.95rem; opacity: 0.9; }

        .scan-container {
          display: flex; flex-direction: column;
          align-items: center; gap: 20px;
        }

        .status-box {
          text-align: center; padding: 28px 24px; background: white;
          border-radius: 14px; max-width: 420px; width: 100%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        .success-box    { border: 2px solid #bbf7d0; }
        .error-box      { border: 2px solid #fecaca; }
        .processing-box { border: 2px solid #bfdbfe; }
        .camera-box     { border: 2px dashed #93c5fd; }

        .status-title     { font-size: 1rem; font-weight: 600; margin: 12px 0 8px; }
        .error-title      { color: #c62828; }
        .processing-title { color: #1e40af; }
        .prompt-title     { color: #1e40af; font-size: 1.15rem; }
        .status-hint      { color: #64748b; font-size: 0.9rem; margin: 0 0 16px; line-height: 1.5; }
        .prompt-hint      { margin-bottom: 20px; }
        .tips-text        { color: #94a3b8; font-size: 0.82rem; font-style: italic; margin-top: 14px; }
        .camera-icon-wrap { margin-bottom: 8px; }

        .btn-row {
          display: flex; gap: 10px; justify-content: center;
          flex-wrap: wrap; margin-top: 4px;
        }

        .btn {
          display: inline-flex; align-items: center; gap: 7px;
          border: none; border-radius: 10px; cursor: pointer;
          font-weight: 600; font-size: 0.95rem;
          padding: 11px 22px; min-height: 46px;
          transition: all 0.18s ease; white-space: nowrap;
        }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

        .btn-primary {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(25,118,210,0.3);
        }

        .btn-danger { background: #dc2626; color: white; }
        .btn-danger:hover:not(:disabled) { background: #b91c1c; }

        .btn-scan {
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          color: white; width: 100%; max-width: 300px;
          justify-content: center; font-size: 1.05rem;
          padding: 14px 28px; border-radius: 12px; margin: 0 auto;
        }
        .btn-scan:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(25,118,210,0.35);
        }

        .info-box {
          background: #f0f9ff; border: 1px solid #7dd3fc;
          border-radius: 12px; padding: 16px 20px;
          max-width: 520px; width: 100%;
          text-align: center; margin-top: 16px;
        }
        .info-title { font-weight: 600; color: #0369a1; margin-bottom: 4px; font-size: 0.9rem; }
        .info-desc  { color: #075985; font-size: 0.85rem; margin: 0; line-height: 1.5; }

        @media (max-width: 768px) {
          .page-content  { padding: 16px 12px; }
          .header-banner { padding: 16px 20px; border-radius: 12px; }
          .header-title  { font-size: 1.4rem; }
          .btn           { min-height: 48px; font-size: 1rem; }
          .btn-scan      { max-width: 100%; }
        }

        /* Tombol lebih besar untuk touch screen */
        @media (hover: none) and (pointer: coarse) {
          .btn { min-height: 52px !important; font-size: 1rem !important; }
        }
      `}</style>
    </div>
  );
}